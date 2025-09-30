import {
  AuthPayload,
  ClientMessageType,
  ServerMessageType,
  WSMessage,
} from "./messages.types";
import { AuthenticatedWebSocket } from "./wsManager";
import jwt, { JwtPayload } from "jsonwebtoken";
import { getInterviewSession, setInterviewSession } from "../lib/redis";

export async function handleWSMessage(ws: AuthenticatedWebSocket, raw: string) {
  let data: WSMessage;

  try {
    data = JSON.parse(raw);
  } catch {
    ws.send(
      JSON.stringify({
        type: ServerMessageType.ERROR,
        payload: "Invalid JSON format",
      })
    );
    return;
  }

  switch (data.type) {
    case ClientMessageType.AUTH: {
      const { token, interviewId } = data.payload as AuthPayload;

      interface TokenPayload extends JwtPayload {
        userId: number;
        email: string;
        role: string;
      }

      jwt.verify(
        token,
        process.env.JWT_SECRET as string,
        async (err, decoded) => {
          if (err || !decoded || typeof decoded === "string") {
            ws.send(
              JSON.stringify({
                type: ServerMessageType.ERROR,
                payload: "Invalid token",
              })
            );
            ws.close();
            return;
          }

          const payload = decoded as TokenPayload;
          ws.user = {
            userId: payload.userId,
            email: payload.email,
            role: payload.role,
          };
          ws.interviewId = interviewId;

          ws.send(JSON.stringify({ type: ServerMessageType.AUTH_SUCCESS }));

          // Send first question if available
          const manager = await getInterviewSession(interviewId);
          if (manager) {
            const q = manager.getCurrentQuestion();
            if (q) {
              ws.send(
                JSON.stringify({ type: ServerMessageType.QUESTION, payload: q })
              );

              // ⏱ Start ticker loop if not running
              if (!ws.ticker) {
                ws.ticker = setInterval(async () => {
                  const mgr = await getInterviewSession(interviewId);
                  if (!mgr) return;

                  const timeLeft = mgr.decrementTimer();
                  await setInterviewSession(interviewId, mgr);

                  const currentQ = mgr.getCurrentQuestion();
                  if (!currentQ) return;

                  // broadcast time updates
                  ws.send(
                    JSON.stringify({
                      type: ServerMessageType.TIME_UPDATE,
                      payload: {
                        questionId: currentQ.id,
                        timeLeft: currentQ.timeLeft,
                      },
                    })
                  );

                  // when time runs out
                  if (timeLeft <= 0) {
                    clearInterval(ws.ticker!);
                    ws.ticker = undefined;

                    const nextQ = mgr.answer("", 0); // auto empty answer
                    await setInterviewSession(interviewId, mgr);

                    if (nextQ) {
                      ws.send(
                        JSON.stringify({
                          type: ServerMessageType.QUESTION,
                          payload: nextQ,
                        })
                      );
                      // restart ticker for nextQ
                      ws.ticker = setInterval(async () => {
                        const mgr2 = await getInterviewSession(interviewId);
                        if (!mgr2) return;
                        const tl2 = mgr2.decrementTimer();
                        await setInterviewSession(interviewId, mgr2);

                        const cq2 = mgr2.getCurrentQuestion();
                        if (!cq2) return;

                        ws.send(
                          JSON.stringify({
                            type: ServerMessageType.TIME_UPDATE,
                            payload: {
                              questionId: cq2.id,
                              timeLeft: cq2.timeLeft,
                            },
                          })
                        );

                        if (tl2 <= 0) {
                          clearInterval(ws.ticker!);
                          ws.ticker = undefined;
                          const nq2 = mgr2.answer("", 0);
                          await setInterviewSession(interviewId, mgr2);

                          if (nq2) {
                            ws.send(
                              JSON.stringify({
                                type: ServerMessageType.QUESTION,
                                payload: nq2,
                              })
                            );
                          } else {
                            ws.send(
                              JSON.stringify({
                                type: ServerMessageType.COMPLETED,
                                payload: mgr2.getReport(),
                              })
                            );
                          }
                        }
                      }, 1000);
                    } else {
                      ws.send(
                        JSON.stringify({
                          type: ServerMessageType.COMPLETED,
                          payload: mgr.getReport(),
                        })
                      );
                    }
                  }
                }, 1000);
              }
            }
          }
        }
      );
      break;
    }

    case ClientMessageType.ANSWER: {
      if (!ws.interviewId || !ws.user) {
        ws.send(
          JSON.stringify({
            type: ServerMessageType.ERROR,
            payload: "Not authenticated",
          })
        );
        return;
      }

      let manager = await getInterviewSession(ws.interviewId);
      if (!manager) {
        ws.send(
          JSON.stringify({
            type: ServerMessageType.ERROR,
            payload: "Interview not found",
          })
        );
        return;
      }

      manager.answer(data.payload?.answer, data.payload?.score ?? 0);
      await setInterviewSession(ws.interviewId, manager);

      const nextQ = manager.getCurrentQuestion();
      if (nextQ) {
        ws.send(
          JSON.stringify({ type: ServerMessageType.QUESTION, payload: nextQ })
        );
      } else {
        ws.send(
          JSON.stringify({
            type: ServerMessageType.COMPLETED,
            payload: manager.getReport(),
          })
        );
      }
      break;
    }

    case ClientMessageType.PAUSE: {
      const manager = await getInterviewSession(ws.interviewId!);
      if (manager) {
        manager.pause();
        await setInterviewSession(ws.interviewId!, manager);
        ws.send(
          JSON.stringify({
            type: ServerMessageType.INFO,
            payload: "Interview paused",
          })
        );
      }
      break;
    }

    case ClientMessageType.RESUME: {
      const manager = await getInterviewSession(ws.interviewId!);
      if (manager) {
        manager.resume();
        await setInterviewSession(ws.interviewId!, manager);
        ws.send(
          JSON.stringify({
            type: ServerMessageType.INFO,
            payload: "Interview resumed",
          })
        );
        const q = manager.getCurrentQuestion();
        if (q) {
          ws.send(
            JSON.stringify({ type: ServerMessageType.QUESTION, payload: q })
          );
        }
      }
      break;
    }

    case ClientMessageType.GET_INTERVIEW: {
      const interviewId = ws.interviewId!;
      const manager = await getInterviewSession(interviewId);

      if (!manager) {
        ws.send(
          JSON.stringify({
            type: ServerMessageType.ERROR,
            payload:
              "Interview not found in memory. Please return to the home page and upload your resume again to start a new interview.",
          })
        );
        break;
      }

      // ✅ Send back the interview state
      ws.send(
        JSON.stringify({
          type: ServerMessageType.INTERVIEW_STATE,
          payload: {
            status: manager.getStatus(),
            currentIndex: manager.currentIndex,
            currentQuestion: manager.getCurrentQuestion(),
          },
        })
      );
      break;
    }

    case ClientMessageType.GET_QUESTION: {
      const interviewId = ws.interviewId!;
      const manager = await getInterviewSession(interviewId);

      if (!manager) {
        ws.send(
          JSON.stringify({
            type: ServerMessageType.ERROR,
            payload: "Interview not found",
          })
        );
        break;
      }

      ws.send(
        JSON.stringify({
          type: ServerMessageType.INTERVIEW_STATE,
          payload: {
            questions: manager.getCurrentQuestion(),
          },
        })
      );
      break;
    }

    default:
      ws.send(
        JSON.stringify({
          type: ServerMessageType.ERROR,
          payload: `Unknown message type: ${data.type}`,
        })
      );
      break;
  }
}
