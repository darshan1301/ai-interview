// Client → Server message types
export enum ClientMessageType {
  AUTH = "auth", // send JWT + interviewId
  ANSWER = "answer", // submit answer
  PAUSE = "pause", // pause interview
  RESUME = "resume", // resume interview
  GET_INTERVIEW = "get_interview", // request current state (status + current question)
  HEARTBEAT = "heartbeat", // optional keep-alive
  GET_QUESTION = "GET_QUESTION",
  GET_ANSWERED = "get_answered",
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
  ANSWERED_LIST = "answered_list",
}
