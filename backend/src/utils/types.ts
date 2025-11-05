import { ClientMessageType, ServerMessageType } from "./messages.types";

// Message types
export const MessageType = {
  QUESTION: "question",
  ANSWER: "answer",
} as const;

export type MessageType = (typeof MessageType)[keyof typeof MessageType];

// Difficulty levels
export const Difficulty = {
  EASY: "easy",
  MEDIUM: "medium",
  HARD: "hard",
} as const;

export type Difficulty = (typeof Difficulty)[keyof typeof Difficulty];

export type BaseQuestion = {
  id: number;
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

export const Role = {
  CANDIDATE: "CANDIDATE",
  INTERVIEWER: "INTERVIEWER",
} as const;

export type Role = (typeof Role)[keyof typeof Role];

export type User = {
  id: string | number;
  name: string;
  email: string;
  phoneNo: string;
};

export const InterviewStatus = {
  READY: "ready",
  PAUSE: "pause",
  IN_PROGRESS: "in_progress",
  COMPLETED: "completed",
} as const;

export type InterviewStatus =
  (typeof InterviewStatus)[keyof typeof InterviewStatus];

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
  status: string; // from InterviewStatus const enum
  currentIndex: number;
  currentQuestion?: any; // can be BaseQuestion
}

export interface WSMessage<T = any> {
  type: ClientMessageType | ServerMessageType;
  payload?: T;
}
