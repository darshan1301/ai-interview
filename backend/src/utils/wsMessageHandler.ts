import { BaseQuestion, InterviewStatus, WSMessage } from "./types";
import { AuthenticatedWebSocket } from "./wsManager";
import {
  deleteInterviewSession,
  getInterviewSession,
  setInterviewSession,
} from "../lib/redis";
import { sendToUser } from "./wsManager";
import { ClientMessageType, ServerMessageType } from "./messages.types";
import { prisma } from "../lib/db";
import { evaluateInterview, questionGenerator } from "./openai.generator";

export async function handleWSMessage(ws: AuthenticatedWebSocket, raw: string) {
  let data: WSMessage;

  try {
    data = JSON.parse(raw);
  } catch {
    if (ws.user) {
      sendToUser(ws.user.userId, {
        type: ServerMessageType.ERROR,
        payload: "Invalid JSON format",
      });
    }
    return;
  }

  switch (data.type) {
    case ClientMessageType.ANSWER: {
      const { interviewId, answer, currentIndex } = data.payload;

      if (!interviewId || !ws.user) {
        sendToUser(ws.user?.userId ?? 0, {
          type: ServerMessageType.ERROR,
          payload: "Not authenticated",
        });
        return;
      }

      let manager = await getInterviewSession(interviewId);

      console.log("/ANSWER-1", answer);
      if (!manager) {
        sendToUser(ws.user.userId, {
          type: ServerMessageType.ERROR,
          payload: "Interview not found",
        });
        return;
      }

      // 🚨 Guard: already completed → ignore
      if (manager.status === InterviewStatus.COMPLETED) {
        console.log("Interview already completed, ignoring answer.");
        return;
      }
      // 1️⃣ Save in Redis
      manager.answer(answer);
      await setInterviewSession(interviewId, manager);

      // 2️⃣ Persist in DB (blocking, ensure consistency)
      const currentQ = manager.getCurrentQuestion();
      console.log(currentQ);
      if (currentQ) {
        let ans = await prisma.question.update({
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
      const answeredCount = manager.questions.filter(
        (q) => q.isAnswered
      ).length;

      // 2️⃣ If we still need more (max 6)
      if (answeredCount < 6 && manager.questions.length < 6) {
        const asked = manager.questions.map((q) => ({
          id: q.id,
          text: q.text,
          difficulty: q.difficulty,
          type: q.type,
        }));

        const newQ = await questionGenerator(asked);

        if (newQ) {
          // Insert into DB
          const created = await prisma.question.create({
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
          let newQue = manager.addQuestion(created as any);

          await setInterviewSession(interviewId, manager);
          console.log("NEW QUE", created.id, interviewId);
          startTimer(ws, created.id, interviewId);
          // Send next question + start timer
          sendToUser(ws.user.userId, {
            type: ServerMessageType.QUESTION,
            payload: created,
          });
          break;
        }
      } else {
        // 3️⃣ Completed after 6 questions
        manager.submit();

        console.log("SUBMIT", manager.status);
        // Update interview status in DB
        const interview = await prisma.interview.update({
          where: { id: Number(interviewId) },
          data: {
            status: InterviewStatus.COMPLETED,
            endTime: new Date(),
          },
          include: {
            questions: true, // ✅ include related questions
          },
        });

        await setInterviewSession(interviewId, manager);

        // use non blocking call to get full report

        let llmReport = await evaluateInterview({
          questions: interview.questions,
        });

        Promise.resolve()
          .then(async () => {
            let result = await prisma.interview.update({
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
        sendToUser(ws.user.userId, {
          type: ServerMessageType.COMPLETED,
          status: interview.status,
          score: llmReport?.score,
          questions: interview.questions.map((q) => ({
            id: q.id,
            text: q.text,
            answer: q.answer,
            summary: llmReport?.summary,
            difficulty: q.difficulty,
            type: q.type,
          })),
        });

        // 🔹 Cleanup Redis session
        await deleteInterviewSession(interviewId);
      }

      break;
    }

    case ClientMessageType.GET_INTERVIEW: {
      console.log("GET_INTERVIEW");
      const { interviewId } = data.payload;
      if (!interviewId || !ws.user) return;

      const interview = await prisma.interview.findFirst({
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
        sendToUser(ws.user.userId, {
          type: ServerMessageType.ERROR,
          payload:
            "Interview not found in memory. Please return to the home page and upload your resume again to start a new interview.",
        });
        break;
      }

      sendToUser(ws.user.userId, {
        type: ServerMessageType.INTERVIEW_STATE,
        payload: {
          status: interview.status,
          currentIndex: interview.questions.length - 1,
          questions: interview.questions,
        },
      });

      break;
    }

    // GET_QUESTION
    case ClientMessageType.GET_QUESTION: {
      const { interviewId } = data.payload;
      if (!interviewId || !ws.user) return;
      console.log("/QUESTION");

      let manager = await getInterviewSession(interviewId);
      // ✅ Early exit if interview is already completed
      if (manager?.getStatus() === InterviewStatus.COMPLETED) {
        console.log("Interview already completed → sending report");

        const interview = await prisma.interview.findUnique({
          where: { id: Number(interviewId) },
          include: { questions: true },
        });

        if (!interview) {
          sendToUser(ws.user.userId, {
            type: ServerMessageType.ERROR,
            payload: "Interview not found",
          });
          break;
        }

        sendToUser(ws.user.userId, {
          type: ServerMessageType.COMPLETED,
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
        const interview = await prisma.interview.findUnique({
          where: { id: Number(interviewId) },
          include: { questions: true },
        });

        if (interview?.status === InterviewStatus.COMPLETED) {
          console.log("Interview already completed (DB) → sending report");
          sendToUser(ws.user.userId, {
            type: ServerMessageType.COMPLETED,
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
        sendToUser(ws.user.userId, {
          type: ServerMessageType.QUESTION,
          payload: question,
        });
        startTimer(ws, question.id, interviewId);
        break;
      }

      const totalQuestions = await prisma.question.count({
        where: { interviewId: Number(interviewId) },
      });
      // ✅ If 6 questions reached but timer still active, don't generate more
      if (totalQuestions >= 6) {
        console.log("Maximum 6 questions reached, waiting for timer to expire");
        sendToUser(ws.user.userId, {
          type: ServerMessageType.ERROR,
          payload:
            "Maximum questions reached. Please answer the current question.",
        });
        break;
      }
      // 🔹 Otherwise → generate or fetch from DB
      let dbQ = await prisma.question.findFirst({
        where: { interviewId: Number(interviewId), isAnswered: false },
        orderBy: { createdAt: "asc" },
      });

      if (!dbQ) {
        const gen = await questionGenerator();
        if (!gen) return;

        // insert new into DB in background (non-blocking)
        dbQ = await prisma.question.create({
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
        } as any;
      }
      console.log("/GET_QUESTION", dbQ);

      // 🔹 Add to manager + Redis
      // Add to manager + Redis
      if (manager) {
        manager.addQuestion(dbQ as any);
        // Ensure status and index are valid
        if (manager.getStatus() === InterviewStatus.COMPLETED) {
          manager.status = InterviewStatus.IN_PROGRESS;
        }
        if (manager.currentIndex >= manager.questions.length) {
          manager.currentIndex = manager.questions.length - 1;
        }

        await setInterviewSession(interviewId, manager);
        question = manager.getCurrentQuestion();
      }

      // 🔹 Send question to frontend
      if (question) {
        sendToUser(ws.user.userId, {
          type: ServerMessageType.QUESTION,
          payload: question,
        });
        startTimer(ws, question.id, interviewId);
      }

      break;
    }

    default:
      if (ws.user) {
        sendToUser(ws.user.userId, {
          type: ServerMessageType.ERROR,
          payload: `Unknown message type: ${data.type}`,
        });
      }
      break;
  }
}

// Timer helper
export async function startTimer(
  ws: AuthenticatedWebSocket,
  qId: number,
  interviewId: number
) {
  if (ws.ticker) clearInterval(ws.ticker);

  // fetch once at start
  let manager = await getInterviewSession(interviewId);
  if (!manager) return;
  if (manager.status === InterviewStatus.COMPLETED) return;

  ws.ticker = setInterval(async () => {
    const currentQ = manager.getCurrentQuestion();
    if (!currentQ || currentQ.id !== qId) return;

    // decrement
    currentQ.timeLeft = Math.max(0, (currentQ.timeLeft ?? 0) - 1);
    console.log("TICK", currentQ.timeLeft);

    // persist back
    await setInterviewSession(interviewId, manager);

    // notify frontend
    sendToUser(ws.user!.userId, {
      type: ServerMessageType.TIME_UPDATE,
      payload: {
        questionId: qId,
        timeLeft: currentQ.timeLeft,
        managerStatus: manager.status,
      },
    });

    // if timer expired
    if (currentQ.timeLeft <= 0) {
      clearInterval(ws.ticker!);
      ws.ticker = undefined;

      manager.answer("");

      (async () => {
        try {
          await prisma.question.update({
            where: { id: currentQ.id },
            data: { isAnswered: true, answer: "", score: 0 },
          });
        } catch (err) {
          console.error("❌ Failed to update question in DB:", err);
        }
      })();

      await setInterviewSession(interviewId, manager);

      handleWSMessage(
        ws,
        JSON.stringify({
          type: ClientMessageType.ANSWER,
          payload: { interviewId, answer: "", score: 0 },
        })
      );
    }
  }, 1000);
}
