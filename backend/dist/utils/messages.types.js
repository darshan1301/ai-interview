"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ServerMessageType = exports.ClientMessageType = void 0;
// Client → Server message types
exports.ClientMessageType = {
    AUTH: "auth",
    ANSWER: "answer",
    PAUSE: "pause",
    RESUME: "resume",
    GET_INTERVIEW: "get_interview",
    HEARTBEAT: "heartbeat",
    GET_QUESTION: "GET_QUESTION",
    GET_ANSWERED: "get_answered",
};
// Server → Client message types
exports.ServerMessageType = {
    AUTH_SUCCESS: "auth_success",
    QUESTION: "question",
    COMPLETED: "completed",
    ERROR: "error",
    INFO: "info",
    INTERVIEW_STATE: "interview_state",
    TIME_UPDATE: "TIME_UPDATE",
    ANSWERED_LIST: "answered_list",
};
