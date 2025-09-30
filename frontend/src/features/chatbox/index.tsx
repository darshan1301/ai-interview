import { useState, useEffect } from "react";
import { Send, MessageSquare } from "lucide-react";
import Message from "./Message";
import ConnectionStatus from "./ConnectionStatus";
import { useSocketManager } from "./socketManager/useSocketManager";
import { useRecoilState } from "recoil";
import { useParams } from "react-router-dom";
import { interviewIdState } from "../chatbox/interviewAtoms";
import { ClientMessageType } from "../../../../backend/src/utils/messages.types";
import Timeleft from "./Timeleft";

const ChatInterface = () => {
  const {
    status,
    questions,
    connectionStatus,
    currentIndex,
    sendMessage,
    interviewId,
    timeLeft,
  } = useSocketManager();

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [, setInterviewId] = useRecoilState(interviewIdState);
  const { interviewId: interviewIdParam } = useParams<{
    interviewId: string;
  }>();
  const [hasRequested, setHasRequested] = useState(false);

  // ✅ Take interviewId from route and store in Recoil
  useEffect(() => {
    if (interviewIdParam) {
      setInterviewId(interviewIdParam);
    }
  }, [interviewIdParam, setInterviewId]);

  // ✅ Auto-start interview once connected
  useEffect(() => {
    if (connectionStatus === "connected" && interviewId && !hasRequested) {
      sendMessage({
        type: ClientMessageType.GET_QUESTION,
        payload: { interviewId },
      });
      setLoading(false);
      setHasRequested(true); // ✅ prevent future calls
    }
  }, [connectionStatus, interviewId, sendMessage, hasRequested]);

  const handleSend = () => {
    console.log(input);
    if (!input.trim() || !interviewId) return;
    sendMessage({
      type: ClientMessageType.ANSWER,
      payload: { interviewId, answer: input, score: 0 },
    });
    sendMessage({
      type: ClientMessageType.GET_ANSWERED,
      payload: { interviewId },
    });
    setInput("");
  };

  const currentQuestion = questions[currentIndex] ?? null;

  // ✅ Loader state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-600">Connecting to interview…</p>
        </div>
      </div>
    );
  }

  // ✅ Always show chat UI (no start/resume button anymore)
  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <div className="flex items-center justify-between">
        {/* Left side */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
            <MessageSquare className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-gray-900">
              AI Interview
            </h1>
            <ConnectionStatus
              isConnected={connectionStatus === "connected"}
              isConnecting={connectionStatus === "connecting"}
            />
          </div>
        </div>

        {/* Right side → show timer if question has timeLeft */}
        <Timeleft time={timeLeft ?? "-"} />
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        <div className="max-w-4xl mx-auto space-y-3">
          {questions.map((q, idx) => (
            <div key={q.id} className="space-y-2">
              <Message
                message={q.text}
                type="question"
                isUser={false}
                status="sent"
                timestamp={new Date()}
              />
              {q.answer && (
                <Message
                  message={q.text}
                  type="answer"
                  isUser={true}
                  status="sent"
                  timestamp={new Date()}
                />
              )}
              {idx === currentIndex && !q.answer && (
                <p className="text-xs text-gray-400">
                  ⏳ Waiting for your answer…
                </p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Input */}
      <div className="flex-shrink-0 bg-white border-t px-4 py-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-end space-x-3">
            <textarea
              placeholder={
                currentQuestion
                  ? "Type your answer..."
                  : "Waiting for next question..."
              }
              className="flex-1 px-4 py-3 border rounded-2xl resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
              rows={1}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              // disabled={!currentQuestion}
            />
            <button
              onClick={handleSend}
              // disabled={!currentQuestion}
              className="w-12 h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-full flex items-center justify-center disabled:bg-gray-300 disabled:cursor-not-allowed">
              <Send className="w-5 h-5" />
            </button>
          </div>

          <div className="mt-3 flex justify-between text-xs text-gray-500">
            <div className="flex space-x-4">
              <span>❓ Question</span>
              <span>💬 Answer</span>
            </div>
            <span>Status: {status}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
