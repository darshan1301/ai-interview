import { ClientMessageType, ServerMessageType } from "./messages.types";

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
  text: string;
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

// ===== Payload Types =====

export interface AuthPayload {
  token: string;
  interviewId: number;
}

export interface AnswerPayload {
  answer: string;
  score?: number;
}

export interface InterviewStatePayload {
  status: string; // from InterviewStatus enum
  currentIndex: number;
  currentQuestion?: any; // can be BaseQuestion
}

export interface WSMessage<T = any> {
  type: ClientMessageType | ServerMessageType;
  payload?: T;
}
