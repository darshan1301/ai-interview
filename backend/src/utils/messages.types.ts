// Client → Server message types
export enum ClientMessageType {
  AUTH = "auth", // send JWT + interviewId
  ANSWER = "answer", // submit answer
  PAUSE = "pause", // pause interview
  RESUME = "resume", // resume interview
  GET_INTERVIEW = "get_interview", // request current state (status + current question)
  HEARTBEAT = "heartbeat", // optional keep-alive
  GET_QUESTION = "GET_QUESTION",
}

// Server → Client message types
export enum ServerMessageType {
  AUTH_SUCCESS = "auth_success",
  QUESTION = "question", // next/current question
  COMPLETED = "completed", // interview finished
  ERROR = "error", // error message
  INFO = "info", // generic updates
  INTERVIEW_STATE = "interview_state", // interview status snapshot
  TIME_UPDATE = "TIME_UPDATE",
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
