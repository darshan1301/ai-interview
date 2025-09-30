export enum MessageType {
  QUESTION = "question",
  ANSWER = "answer",
}

export enum Difficulty {
  EASY = "easy",
  MEDIUM = "medium",
  HARD = "hard",
}

export type BaseQuestion = {
  id: string | number;
  statement: string;
  difficulty: Difficulty;
  answer?: string;
  timeLeft: number;
  isAnswered: boolean;
  score: number;
  type: "mcq" | "opinion";
};

export type QuestionType = "mcq" | "opinion";

// MCQ Question
export interface MCQQuestion extends BaseQuestion {
  type: "mcq";
  options: string[];
  correctAnswer?: string;
}

// Opinionated / Open-ended Question
export interface OpinionQuestion extends BaseQuestion {
  type: "opinion";
}

export enum Role {
  CANDIDATE = "candidate",
  INTERVIEWER = "interviewer",
}
export type User = {
  id: string | number;
  name: string;
  email: string;
  phoneNo: string;
};

export enum InterviewStatus {
  READY = "ready",
  PAUSE = "pause",
  IN_PROGRESS = "in_progress",
  COMPLETED = "completed",
}
