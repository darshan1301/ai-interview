import { useRecoilState, useResetRecoilState } from "recoil";
import {
  interviewIdState,
  questionsState,
  currentIndexState,
  statusState,
} from "./interviewAtoms";
import type { Question } from "./interviewAtoms.ts";

export function useInterviewManager() {
  const [interviewId, setInterviewId] = useRecoilState(interviewIdState);
  const [questions, setQuestions] = useRecoilState(questionsState);
  const [currentIndex, setCurrentIndex] = useRecoilState(currentIndexState);
  const [status, setStatus] = useRecoilState(statusState);

  const resetInterviewId = useResetRecoilState(interviewIdState);

  const start = (id: string, qs: Question[]) => {
    setInterviewId(id);
    setQuestions(qs);
    setCurrentIndex(0);
    setStatus("in_progress");
  };

  const getCurrentQuestion = () => {
    if (status === "completed") return null;
    return questions[currentIndex] ?? null;
  };

  const answer = async (ans: string) => {
    const question = questions[currentIndex];
    if (!question || !interviewId) return;

    // send answer immediately to backend
    await fetch(`/api/interviews/${interviewId}/answer`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        questionId: question.id,
        answer: ans,
      }),
    });

    // move to next question
    if (currentIndex + 1 >= questions.length) {
      setStatus("completed");
    } else {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const decrementTimer = () => {
    const question = questions[currentIndex];
    if (!question) return 0;

    if (question.timeLeft > 0) {
      const updated = [...questions];
      updated[currentIndex].timeLeft -= 1;
      setQuestions(updated);
    }
    return question.timeLeft;
  };

  const pause = () => {
    if (status === "in_progress") setStatus("pause");
  };

  const resume = () => {
    if (status === "pause") setStatus("in_progress");
  };

  const complete = () => setStatus("completed");

  const reset = () => {
    resetInterviewId();
    setQuestions([]);
    setCurrentIndex(0);
    setStatus("ready");
  };

  return {
    interviewId,
    questions,
    currentIndex,
    status,
    start,
    getCurrentQuestion,
    answer,
    decrementTimer,
    pause,
    resume,
    complete,
    reset,
  };
}
