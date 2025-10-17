// Client → Server message types
export const ClientMessageType = {
  AUTH: "auth",
  ANSWER: "answer",
  PAUSE: "pause",
  RESUME: "resume",
  GET_INTERVIEW: "get_interview",
  HEARTBEAT: "heartbeat",
  GET_QUESTION: "get_question",
  GET_ANSWERED: "get_answered",
} as const;

export type ClientMessageType =
  (typeof ClientMessageType)[keyof typeof ClientMessageType];

// Server → Client message types
export const ServerMessageType = {
  AUTH_SUCCESS: "auth_success",
  QUESTION: "question",
  COMPLETED: "completed",
  ERROR: "error",
  INFO: "info",
  INTERVIEW_STATE: "interview_state",
  TIME_UPDATE: "TIME_UPDATE",
  ANSWERED_LIST: "answered_list",
} as const;

export type ServerMessageType =
  (typeof ServerMessageType)[keyof typeof ServerMessageType];
