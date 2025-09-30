import { WSMessage } from "./types";
import { AuthenticatedWebSocket } from "./wsManager";
import { getInterviewSession, setInterviewSession } from "../lib/redis";
import { sendToUser } from "./wsManager";
import { ClientMessageType, ServerMessageType } from "./messages.types";
import { prisma } from "../lib/db";
import { questionGenerator } from "./question.generator";

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
      const { interviewId, answer, score = 0 } = data.payload;
      console.log("ANSWER", ws.user, interviewId, answer);

      if (!interviewId || !ws.user) {
        sendToUser(ws.user?.userId ?? 0, {
          type: ServerMessageType.ERROR,
          payload: "Not authenticated",
        });
        return;
      }

      let manager = await getInterviewSession(interviewId);
      if (!manager) {
        sendToUser(ws.user.userId, {
          type: ServerMessageType.ERROR,
          payload: "Interview not found",
        });
        return;
      }

      // 1️⃣ Update in memory + Redis
      const currentQ = manager.getCurrentQuestion();
      manager.answer(answer, score);
      await setInterviewSession(interviewId, manager);

      // 2️⃣ Persist asynchronously into DB (non-blocking)
      if (currentQ) {
        prisma.question
          .update({
            where: { id: Number(currentQ.id) },
            data: {
              answer: answer ?? "",
              isAnswered: true,
              score,
            },
          })
          .then(() => {
            console.log(`✅ Question ${currentQ.id} updated in DB`);
          })
          .catch((err) => {
            console.error(`❌ Failed to update question ${currentQ.id}`, err);
          });
      }

      // 3️⃣ Continue interview flow
      const nextQ = manager.getCurrentQuestion();
      if (nextQ) {
        sendToUser(ws.user.userId, {
          type: ServerMessageType.QUESTION,
          payload: nextQ,
        });
      } else {
        sendToUser(ws.user.userId, {
          type: ServerMessageType.COMPLETED,
          payload: manager.getReport(),
        });
      }
      break;
    }

    case ClientMessageType.PAUSE: {
      const { interviewId } = data.payload;
      if (!interviewId || !ws.user) return;

      const manager = await getInterviewSession(interviewId);
      if (manager) {
        manager.pause();
        await setInterviewSession(interviewId, manager);
        sendToUser(ws.user.userId, {
          type: ServerMessageType.INFO,
          payload: "Interview paused",
        });
      }
      break;
    }

    case ClientMessageType.RESUME: {
      const { interviewId } = data.payload;
      if (!interviewId || !ws.user) return;

      const manager = await getInterviewSession(interviewId);
      if (manager) {
        manager.resume();
        await setInterviewSession(interviewId, manager);

        sendToUser(ws.user.userId, {
          type: ServerMessageType.INFO,
          payload: "Interview resumed",
        });

        const q = manager.getCurrentQuestion();
        if (q) {
          sendToUser(ws.user.userId, {
            type: ServerMessageType.QUESTION,
            payload: q,
          });
        }
      }
      break;
    }

    case ClientMessageType.GET_INTERVIEW: {
      const { interviewId } = data.payload;
      if (!interviewId || !ws.user) return;

      const manager = await getInterviewSession(interviewId);
      if (!manager) {
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
          status: manager.getStatus(),
          currentIndex: manager.currentIndex,
          currentQuestion: manager.getCurrentQuestion(),
        },
      });

      break;
    }

    // GET_QUESTION
    case ClientMessageType.GET_QUESTION: {
      const { interviewId } = data.payload;
      if (!interviewId || !ws.user) return;

      // 1️⃣ Find the first unanswered question
      let question = await prisma.question.findFirst({
        where: { interviewId: Number(interviewId), isAnswered: false },
        orderBy: { id: "asc" },
      });

      // 2️⃣ If none → generate new and insert
      if (!question) {
        const gen = await questionGenerator();
        if (!gen) return;

        const q = gen;
        question = await prisma.question.create({
          data: {
            interviewId: Number(interviewId),
            text: q.text,
            difficulty: q.difficulty,
            type: q.type,
            isAnswered: false,
            answer: "",
            score: 0,
          },
        });
      }

      if (question) {
        sendToUser(ws.user.userId, {
          type: ServerMessageType.QUESTION,
          payload: question,
        });
        console.log("QUESTION", question);
        // start timer loop
        startTimer(ws, question.id, interviewId);
      }
      break;
    }

    case ClientMessageType.GET_ANSWERED: {
      const { interviewId } = data.payload;
      console.log("GET_ANSWERED for interview", interviewId);

      if (!interviewId || !ws.user) {
        ws.send(
          JSON.stringify({
            type: ServerMessageType.ERROR,
            payload: "Not authenticated or invalid interview",
          })
        );
        return;
      }

      // Fetch answered questions from DB
      prisma.question
        .findMany({
          where: {
            interviewId: Number(interviewId),
            isAnswered: true,
          },
          orderBy: { id: "asc" },
          select: {
            id: true,
            text: true,
            answer: true,
            score: true,
            difficulty: true,
          },
        })
        .then((answered) => {
          ws.send(
            JSON.stringify({
              type: ServerMessageType.ANSWERED_LIST,
              payload: answered,
            })
          );
        })
        .catch((err) => {
          console.error("❌ Failed to fetch answered questions", err);
          ws.send(
            JSON.stringify({
              type: ServerMessageType.ERROR,
              payload: "Could not fetch answered questions",
            })
          );
        });

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

  ws.ticker = setInterval(async () => {
    // 🔹 Fetch interview manager from Redis
    const manager = await getInterviewSession(interviewId);
    if (!manager) return;

    const currentQ = manager.getCurrentQuestion();
    if (!currentQ || currentQ.id !== qId) return;

    // decrement timer
    const newTime = manager.decrementTimer();

    console.log("TICK");

    // persist back to Redis
    await setInterviewSession(interviewId, manager);

    // notify frontend
    sendToUser(ws.user!.userId, {
      type: ServerMessageType.TIME_UPDATE,
      payload: { questionId: qId, timeLeft: newTime },
    });

    if (newTime <= 0) {
      clearInterval(ws.ticker!);
      ws.ticker = undefined;

      // auto mark unanswered in Redis
      manager.answer("", 0);
      await setInterviewSession(interviewId, manager);

      // trigger next question generation (simulate ANSWER flow)
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
