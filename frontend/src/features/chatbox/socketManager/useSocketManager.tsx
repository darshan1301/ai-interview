import { useEffect, useRef, useState } from "react";
import { useRecoilState } from "recoil";
import {
  interviewIdState,
  questionsState,
  currentIndexState,
  statusState,
  reportState,
  timeLeftState,
} from "../interviewAtoms";
import { WS_API_URL } from "../../../config";
import { ServerMessageType } from "../../../../../backend/src/utils/messages.types";
import { InterviewStatus } from "../../../../../backend/src/utils/types";

export type ReportQuestion = {
  id: number;
  text: string;
  answer: string;
  score: number;
  difficulty: "easy" | "medium" | "hard";
  type: string; // e.g. "opinion", "mcq"
};

export type ReportType = {
  type: "completed";
  status: "completed";
  questions: ReportQuestion[];
  summary?: string;
  score: number;
};

export function useSocketManager() {
  const wsRef = useRef<WebSocket | null>(null);

  // Recoil state
  const [interviewId] = useRecoilState(interviewIdState);
  const [questions, setQuestions] = useRecoilState(questionsState);
  const [currentIndex, setCurrentIndex] = useRecoilState(currentIndexState);
  const [status, setStatus] = useRecoilState(statusState);
  const [timeLeft, setTimeLeft] = useRecoilState(timeLeftState);
  const [report, setReport] = useRecoilState(reportState);

  // Explicit connection status
  const [connectionStatus, setConnectionStatus] = useState<
    "connecting" | "connected" | "disconnected"
  >("disconnected");

  // 👉 Local state for server time/info messages
  const [serverTime, setServerTime] = useState<string>("");

  // --- Connection management ---
  const connect = () => {
    if (wsRef.current) return; // already connected

    setConnectionStatus("connecting");
    const ws = new WebSocket(WS_API_URL, []); // cookies auto-sent if same domain
    wsRef.current = ws;

    ws.onopen = () => {
      console.log("✅ WebSocket connected");
      setConnectionStatus("connected");
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log("MESSAGE:", data);
        switch (data.type) {
          case ServerMessageType.AUTH_SUCCESS:
            console.log("🔐 Authenticated");
            break;

          case ServerMessageType.QUESTION:
            setQuestions((prev) => [...prev, data.payload]);
            setCurrentIndex((i) => i + 1);
            break;

          case ServerMessageType.TIME_UPDATE: {
            const { questionId, timeLeft, managerStatus } = data.payload;

            // store time left separately
            setTimeLeft(timeLeft);
            setStatus(managerStatus);

            // optional: still update the questions array if you want history
            setQuestions((prev) =>
              prev.map((q) => (q.id === questionId ? { ...q, timeLeft } : q))
            );

            break;
          }

          case ServerMessageType.INTERVIEW_STATE:
            if (data.payload?.questions) setQuestions(data.payload.questions);
            if (data.payload?.status) setStatus(data.payload.status);
            if (typeof data.payload?.currentIndex === "number") {
              setCurrentIndex(data.payload.currentIndex);
            }
            break;

          case ServerMessageType.COMPLETED:
            setStatus(InterviewStatus.COMPLETED);
            setReport(data);

            console.log("📄 Report:", data);
            break;

          case ServerMessageType.ERROR:
            console.error("❌ WS Error:", data.payload);
            break;

          case ServerMessageType.INFO:
            console.info("ℹ️ WS Info:", data.payload);
            setServerTime(data.payload); // <-- save server time here
            break;

          case ServerMessageType.ANSWERED_LIST:
            console.log("✅ Answered questions:", data.payload);
            // You can store in Recoil or local state
            break;

          default:
            console.warn("⚠️ Unknown WS message:", data);
        }
      } catch (err) {
        console.error("❌ Failed to parse WS message:", err);
      }
    };

    ws.onclose = () => {
      console.log("🔌 WebSocket closed");
      wsRef.current = null;
      setConnectionStatus("disconnected");
    };

    ws.onerror = () => {
      console.error("⚠️ WebSocket error");
      setConnectionStatus("disconnected");
    };
  };

  useEffect(() => {
    connect();

    return () => {
      wsRef.current?.close();
      wsRef.current = null;
      setConnectionStatus("disconnected");
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const retry = () => {
    wsRef.current?.close();
    wsRef.current = null;
    connect();
  };

  const sendMessage = (msg: object) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(msg));
    } else {
      console.warn("⚠️ WebSocket not connected");
    }
  };

  return {
    // manual send
    sendMessage,
    setTimeLeft,
    setQuestions,

    // exposed states
    report,
    timeLeft,
    status,
    questions,
    currentIndex,
    interviewId,
    connectionStatus,
    serverTime, // <-- expose it here

    // connection utils
    retry,
  };
}
