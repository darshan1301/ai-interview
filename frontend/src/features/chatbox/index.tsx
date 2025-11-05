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
import StatusBadge from "./StatusBadge";

const ChatInterface = () => {
  const {
    status,
    connectionStatus,
    questions,
    currentIndex,
    sendMessage,
    setQuestions,
    interviewId,
    setTimeLeft,
    report,
    retry,
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

  // // ✅ Reset hasRequested when disconnected
  useEffect(() => {
    if (connectionStatus === "disconnected") {
      setHasRequested(false);
    }
  }, [connectionStatus]);

  // ✅ Auto-start interview once connected
  useEffect(() => {
    if (connectionStatus === "connected" && interviewId && !hasRequested) {
      // First get the interview data
      sendMessage({
        type: ClientMessageType.GET_INTERVIEW,
        payload: { interviewId },
      });

      // Then immediately request the first question
      sendMessage({
        type: ClientMessageType.GET_QUESTION,
        payload: { interviewId },
      });

      setLoading(false);
      setHasRequested(true);
    }
  }, [connectionStatus, interviewId, sendMessage, hasRequested]);

  const handleSend = () => {
    setTimeLeft(0);
    if (!input.trim() || !interviewId) return;

    const updatedQuestions = questions.map((q, index) => {
      if (index === questions.length - 1) {
        return { ...q, answer: input }; // Create new object with updated answer
      }
      return q;
    });
    setQuestions(updatedQuestions);
    sendMessage({
      type: ClientMessageType.ANSWER,
      payload: { interviewId, answer: input, currentIndex },
    });

    setInput("");
  };

  function reconnect() {
    if (connectionStatus !== "connected") {
      retry();
      sendMessage({
        type: ClientMessageType.GET_INTERVIEW,
        payload: { interviewId },
      });
    }
  }

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

  // ✅ COMPLETED MODE
  if (status === "completed") {
    return (
      <div className="flex flex-col h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 px-2 bg-blue-600 rounded-full flex items-center justify-center">
              {" "}
              <MessageSquare className="w-5 h-5 text-white" />{" "}
            </div>
            <div>
              <h1 className="text-lg font-semibold text-gray-900">
                Interview Report
              </h1>
              <ConnectionStatus
                isConnected={connectionStatus === "connected"}
                isConnecting={connectionStatus === "connecting"}
                onRetry={reconnect}
              />
            </div>
          </div>
        </div>

        {/* Report */}
        <div className="flex-1 overflow-y-auto px-4 py-4">
          <div className="max-w-4xl mx-auto space-y-6">
            {!report?.questions ? (
              // ⚠️ No report yet
              <div className="text-center text-gray-500 italic py-10">
                ⚠️ Report not available. Wait for a minute or come back in a
                while.
              </div>
            ) : (
              <>
                {/* Status */}
                <div className="p-4 bg-white rounded-lg shadow border">
                  <h2 className="text-lg font-semibold text-gray-900">
                    Interview Report
                  </h2>
                  <p className="mt-1 text-sm text-gray-600">
                    Status:{" "}
                    <span className="font-medium text-green-700">
                      {report.status}
                    </span>
                  </p>
                </div>

                {/* Questions */}
                {Array.isArray(report.questions) &&
                report.questions.length > 0 ? (
                  report.questions.map((q) => (
                    <div
                      key={q.id}
                      className="p-4 bg-white rounded-lg shadow border space-y-2">
                      <div
                        className="text-sm leading-relaxed"
                        dangerouslySetInnerHTML={{ __html: q.text }}
                      />
                      {q.answer ? (
                        <p className="text-gray-700">A: {q.answer}</p>
                      ) : (
                        <p className="text-xs text-gray-400 italic">
                          No answer recorded.
                        </p>
                      )}
                      <div className="text-xs text-gray-500 flex justify-between">
                        <span
                          className={`px-2 py-1 rounded ${
                            q.difficulty === "easy"
                              ? "bg-green-100 text-green-700"
                              : q.difficulty === "medium"
                              ? "bg-yellow-100 text-yellow-700"
                              : "bg-red-100 text-red-700"
                          }`}>
                          {q.difficulty}
                        </span>
                        {/* <span>Score: {q.score}</span> */}
                        <span className="italic text-gray-400">{q.type}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center text-gray-400 italic">
                    No questions found in this report.
                  </div>
                )}

                {/* Footer */}
                <div className="my-8 max-w-2xl mx-auto">
                  {/* Header Badge */}
                  <div className="text-center mb-6">
                    <div className="inline-flex items-center gap-2 bg-gradient-to-r from-green-50 to-emerald-50 text-green-700 px-6 py-3 rounded-full font-semibold shadow-md border border-green-200">
                      <span className="text-2xl">🎉</span>
                      <span>Interview Completed</span>
                    </div>
                  </div>

                  {/* Score Display */}
                  <div className="flex justify-center mb-6">
                    <div className="relative">
                      <div className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg">
                        <div className="text-center">
                          <div className="text-4xl font-bold text-white">
                            {report.score}
                          </div>
                          <div className="text-xs text-blue-100 font-medium">
                            out of 100
                          </div>
                        </div>
                      </div>
                      <div className="absolute -bottom-2 -right-2 bg-yellow-400 rounded-full p-2 shadow-md">
                        <span className="text-lg">⭐</span>
                      </div>
                    </div>
                  </div>

                  {/* Summary Card */}
                  <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-3">
                      Performance Summary
                    </h3>
                    <p className="text-gray-700 leading-relaxed">
                      {report.summary}
                    </p>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 bg-white border-t px-4 py-4">
          <div className="text-center text-gray-500 text-sm py-3">
            ✅ This interview is closed.
          </div>
          <StatusBadge status={status} />
        </div>
      </div>
    );
  }

  // ✅ NORMAL CHAT MODE
  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
            <MessageSquare className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-gray-900">
              AI Interview
            </h1>
            <ConnectionStatus
              onRetry={reconnect}
              isConnected={connectionStatus === "connected"}
              isConnecting={connectionStatus === "connecting"}
            />
          </div>
        </div>
        <Timeleft />
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        <div className="max-w-4xl mx-auto space-y-3">
          {questions.length === 0 ? (
            <p className="text-center text-sm text-gray-400">
              ⏳ Preparing your interview… please wait.
            </p>
          ) : (
            questions.map((q, idx) => (
              <div
                key={q.id}
                className="space-y-2 p-3 border rounded-lg bg-white shadow-sm">
                <Message
                  message={q.text}
                  type="question"
                  isUser={false}
                  status="sent"
                  // timestamp={new Date()}
                />
                {q.answer && (
                  <Message
                    message={q.answer}
                    type="answer"
                    isUser={true}
                    status="sent"
                    // timestamp={new Date()}
                  />
                )}
                {idx === currentIndex && !q.answer && (
                  <p className="text-xs text-gray-400 italic">
                    ⏳ Waiting for your answer…
                  </p>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Input */}
      <div className="flex-shrink-0 bg-white border-t px-4 py-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-end space-x-3">
            <textarea
              placeholder={"Type your answer..."}
              className="flex-1 px-4 py-3 border rounded-2xl resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
              rows={1}
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />
            <button
              onClick={handleSend}
              // disabled={timeLeft === null || timeLeft <= 0} // ✅ disable when timer expired or not ready
              className="w-12 h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-full flex items-center justify-center disabled:bg-gray-300 disabled:cursor-not-allowed">
              <Send className="w-5 h-5" />
            </button>
          </div>
          <StatusBadge status={status} />
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
