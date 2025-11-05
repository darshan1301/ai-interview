"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleWSMessage = handleWSMessage;
exports.startTimer = startTimer;
const types_1 = require("./types");
const redis_1 = require("../lib/redis");
const wsManager_1 = require("./wsManager");
const messages_types_1 = require("./messages.types");
const db_1 = require("../lib/db");
const openai_generator_1 = require("./openai.generator");
async function handleWSMessage(ws, raw) {
    let data;
    try {
        data = JSON.parse(raw);
    }
    catch {
        if (ws.user) {
            (0, wsManager_1.sendToUser)(ws.user.userId, {
                type: messages_types_1.ServerMessageType.ERROR,
                payload: "Invalid JSON format",
            });
        }
        return;
    }
    switch (data.type) {
        case messages_types_1.ClientMessageType.ANSWER: {
            const { interviewId, answer, currentIndex } = data.payload;
            if (!interviewId || !ws.user) {
                (0, wsManager_1.sendToUser)(ws.user?.userId ?? 0, {
                    type: messages_types_1.ServerMessageType.ERROR,
                    payload: "Not authenticated",
                });
                return;
            }
            let manager = await (0, redis_1.getInterviewSession)(interviewId);
            console.log("/ANSWER-1", answer);
            if (!manager) {
                (0, wsManager_1.sendToUser)(ws.user.userId, {
                    type: messages_types_1.ServerMessageType.ERROR,
                    payload: "Interview not found",
                });
                return;
            }
            // 🚨 Guard: already completed → ignore
            if (manager.status === types_1.InterviewStatus.COMPLETED) {
                console.log("Interview already completed, ignoring answer.");
                return;
            }
            // 1️⃣ Save in Redis
            manager.answer(answer);
            await (0, redis_1.setInterviewSession)(interviewId, manager);
            // 2️⃣ Persist in DB (blocking, ensure consistency)
            const currentQ = manager.getCurrentQuestion();
            console.log(currentQ);
            if (currentQ) {
                let ans = await db_1.prisma.question.update({
                    where: { id: currentQ.id },
                    data: {
                        isAnswered: true,
                        answer,
                        score: 0,
                    },
                });
            }
            //clear old timer
            if (ws.ticker) {
                clearInterval(ws.ticker);
                ws.ticker = undefined;
            }
            // Count answered questions
            const answeredCount = manager.questions.filter((q) => q.isAnswered).length;
            // 2️⃣ If we still need more (max 6)
            if (answeredCount < 6 && manager.questions.length < 6) {
                const asked = manager.questions.map((q) => ({
                    id: q.id,
                    text: q.text,
                    difficulty: q.difficulty,
                    type: q.type,
                }));
                const newQ = await (0, openai_generator_1.questionGenerator)(asked);
                if (newQ) {
                    // Insert into DB
                    const created = await db_1.prisma.question.create({
                        data: {
                            interviewId: Number(interviewId),
                            text: newQ.text,
                            difficulty: newQ.difficulty,
                            type: newQ.type,
                            isAnswered: false,
                            answer: "",
                            score: 0,
                        },
                    });
                    // Add to manager + persist
                    let newQue = manager.addQuestion(created);
                    await (0, redis_1.setInterviewSession)(interviewId, manager);
                    console.log("NEW QUE", created.id, interviewId);
                    startTimer(ws, created.id, interviewId);
                    // Send next question + start timer
                    (0, wsManager_1.sendToUser)(ws.user.userId, {
                        type: messages_types_1.ServerMessageType.QUESTION,
                        payload: created,
                    });
                    break;
                }
            }
            else {
                // 3️⃣ Completed after 6 questions
                manager.submit();
                console.log("SUBMIT", manager.status);
                // Update interview status in DB
                const interview = await db_1.prisma.interview.update({
                    where: { id: Number(interviewId) },
                    data: {
                        status: types_1.InterviewStatus.COMPLETED,
                        endTime: new Date(),
                    },
                    include: {
                        questions: true, // ✅ include related questions
                    },
                });
                await (0, redis_1.setInterviewSession)(interviewId, manager);
                // use non blocking call to get full report
                let llmReport = await (0, openai_generator_1.evaluateInterview)({
                    questions: interview.questions,
                });
                Promise.resolve()
                    .then(async () => {
                    let result = await db_1.prisma.interview.update({
                        where: {
                            id: Number(interviewId),
                        },
                        data: {
                            summary: llmReport?.summary,
                            endTime: new Date(),
                            score: llmReport?.score,
                        },
                    });
                    return result;
                })
                    .then((result) => {
                    console.log("Success:", result);
                })
                    .catch((error) => {
                    console.error("Error:", error);
                });
                console.log("REPORT", llmReport);
                (0, wsManager_1.sendToUser)(ws.user.userId, {
                    type: messages_types_1.ServerMessageType.COMPLETED,
                    status: interview.status,
                    score: llmReport?.score,
                    summary: llmReport?.summary,
                    questions: interview.questions.map((q) => ({
                        id: q.id,
                        text: q.text,
                        answer: q.answer,
                        difficulty: q.difficulty,
                        type: q.type,
                    })),
                });
                // 🔹 Cleanup Redis session
                await (0, redis_1.deleteInterviewSession)(interviewId);
            }
            break;
        }
        case messages_types_1.ClientMessageType.GET_INTERVIEW: {
            console.log("GET_INTERVIEW");
            const { interviewId } = data.payload;
            if (!interviewId || !ws.user)
                return;
            const interview = await db_1.prisma.interview.findFirst({
                where: {
                    id: Number(interviewId),
                },
                include: {
                    questions: {
                        orderBy: {
                            createdAt: "asc",
                        },
                    },
                },
            });
            if (!interview) {
                (0, wsManager_1.sendToUser)(ws.user.userId, {
                    type: messages_types_1.ServerMessageType.ERROR,
                    payload: "Interview not found in memory. Please return to the home page and upload your resume again to start a new interview.",
                });
                break;
            }
            (0, wsManager_1.sendToUser)(ws.user.userId, {
                type: messages_types_1.ServerMessageType.INTERVIEW_STATE,
                payload: {
                    status: interview.status,
                    currentIndex: interview.questions.length - 1,
                    questions: interview.questions,
                },
            });
            break;
        }
        // GET_QUESTION
        case messages_types_1.ClientMessageType.GET_QUESTION: {
            const { interviewId } = data.payload;
            if (!interviewId || !ws.user)
                return;
            console.log("/QUESTION");
            let manager = await (0, redis_1.getInterviewSession)(interviewId);
            // ✅ Early exit if interview is already completed
            if (manager?.getStatus() === types_1.InterviewStatus.COMPLETED) {
                console.log("Interview already completed → sending report");
                const interview = await db_1.prisma.interview.findUnique({
                    where: { id: Number(interviewId) },
                    include: { questions: true },
                });
                if (!interview) {
                    (0, wsManager_1.sendToUser)(ws.user.userId, {
                        type: messages_types_1.ServerMessageType.ERROR,
                        payload: "Interview not found",
                    });
                    break;
                }
                (0, wsManager_1.sendToUser)(ws.user.userId, {
                    type: messages_types_1.ServerMessageType.COMPLETED,
                    status: interview.status,
                    score: interview.score,
                    questions: interview.questions.map((q) => ({
                        id: q.id,
                        text: q.text,
                        answer: q.answer,
                        score: q.score || 0,
                        difficulty: q.difficulty,
                        type: q.type,
                    })),
                });
                break;
            }
            // ✅ If no Redis manager → fallback to DB
            if (!manager) {
                const interview = await db_1.prisma.interview.findUnique({
                    where: { id: Number(interviewId) },
                    include: { questions: true },
                });
                if (interview?.status === types_1.InterviewStatus.COMPLETED) {
                    console.log("Interview already completed (DB) → sending report");
                    (0, wsManager_1.sendToUser)(ws.user.userId, {
                        type: messages_types_1.ServerMessageType.COMPLETED,
                        status: interview.status,
                        summary: interview.summary,
                        score: interview.score,
                        questions: interview.questions.map((q) => ({
                            id: q.id,
                            text: q.text,
                            answer: q.answer,
                            score: q.score,
                            difficulty: q.difficulty,
                            type: q.type,
                        })),
                    });
                    break;
                }
            }
            let question = manager?.getCurrentQuestion();
            // 🔹 If Redis already has a question, just return it
            if (question) {
                (0, wsManager_1.sendToUser)(ws.user.userId, {
                    type: messages_types_1.ServerMessageType.QUESTION,
                    payload: question,
                });
                startTimer(ws, question.id, interviewId);
                break;
            }
            const totalQuestions = await db_1.prisma.question.count({
                where: { interviewId: Number(interviewId) },
            });
            // ✅ If 6 questions reached but timer still active, don't generate more
            if (totalQuestions >= 6) {
                console.log("Maximum 6 questions reached, waiting for timer to expire");
                (0, wsManager_1.sendToUser)(ws.user.userId, {
                    type: messages_types_1.ServerMessageType.ERROR,
                    payload: "Maximum questions reached. Please answer the current question.",
                });
                break;
            }
            // 🔹 Otherwise → generate or fetch from DB
            let dbQ = await db_1.prisma.question.findFirst({
                where: { interviewId: Number(interviewId), isAnswered: false },
                orderBy: { createdAt: "asc" },
            });
            if (!dbQ) {
                const gen = await (0, openai_generator_1.questionGenerator)();
                if (!gen)
                    return;
                // insert new into DB in background (non-blocking)
                dbQ = await db_1.prisma.question.create({
                    data: {
                        interviewId: Number(interviewId),
                        text: gen.text,
                        difficulty: gen.difficulty,
                        type: gen.type,
                        isAnswered: false,
                        answer: "",
                        score: 0,
                    },
                });
                // create runtime question object with timer
                dbQ = {
                    id: dbQ.id, // temporary ID (replace with real one after DB insert if needed)
                    interviewId: Number(interviewId),
                    text: gen.text,
                    difficulty: gen.difficulty,
                    type: gen.type,
                    isAnswered: false,
                    answer: "",
                    score: 0,
                };
            }
            console.log("/GET_QUESTION", dbQ);
            // 🔹 Add to manager + Redis
            // Add to manager + Redis
            if (manager) {
                manager.addQuestion(dbQ);
                // Ensure status and index are valid
                if (manager.getStatus() === types_1.InterviewStatus.COMPLETED) {
                    manager.status = types_1.InterviewStatus.IN_PROGRESS;
                }
                if (manager.currentIndex >= manager.questions.length) {
                    manager.currentIndex = manager.questions.length - 1;
                }
                await (0, redis_1.setInterviewSession)(interviewId, manager);
                question = manager.getCurrentQuestion();
            }
            // 🔹 Send question to frontend
            if (question) {
                (0, wsManager_1.sendToUser)(ws.user.userId, {
                    type: messages_types_1.ServerMessageType.QUESTION,
                    payload: question,
                });
                startTimer(ws, question.id, interviewId);
            }
            break;
        }
        default:
            if (ws.user) {
                (0, wsManager_1.sendToUser)(ws.user.userId, {
                    type: messages_types_1.ServerMessageType.ERROR,
                    payload: `Unknown message type: ${data.type}`,
                });
            }
            break;
    }
}
// Timer helper
async function startTimer(ws, qId, interviewId) {
    if (ws.ticker)
        clearInterval(ws.ticker);
    // fetch once at start
    let manager = await (0, redis_1.getInterviewSession)(interviewId);
    if (!manager)
        return;
    if (manager.status === types_1.InterviewStatus.COMPLETED)
        return;
    ws.ticker = setInterval(async () => {
        const currentQ = manager.getCurrentQuestion();
        if (!currentQ || currentQ.id !== qId)
            return;
        // decrement
        currentQ.timeLeft = Math.max(0, (currentQ.timeLeft ?? 0) - 1);
        console.log("TICK", currentQ.timeLeft);
        // persist back
        await (0, redis_1.setInterviewSession)(interviewId, manager);
        // notify frontend
        (0, wsManager_1.sendToUser)(ws.user.userId, {
            type: messages_types_1.ServerMessageType.TIME_UPDATE,
            payload: {
                questionId: qId,
                timeLeft: currentQ.timeLeft,
                managerStatus: manager.status,
            },
        });
        // if timer expired
        if (currentQ.timeLeft <= 0) {
            clearInterval(ws.ticker);
            ws.ticker = undefined;
            manager.answer("");
            (async () => {
                try {
                    await db_1.prisma.question.update({
                        where: { id: currentQ.id },
                        data: { isAnswered: true, answer: "", score: 0 },
                    });
                }
                catch (err) {
                    console.error("❌ Failed to update question in DB:", err);
                }
            })();
            await (0, redis_1.setInterviewSession)(interviewId, manager);
            handleWSMessage(ws, JSON.stringify({
                type: messages_types_1.ClientMessageType.ANSWER,
                payload: { interviewId, answer: "", score: 0 },
            }));
        }
    }, 1000);
}
