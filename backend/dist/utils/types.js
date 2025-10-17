"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InterviewStatus = exports.Role = exports.Difficulty = exports.MessageType = void 0;
// Message types
exports.MessageType = {
    QUESTION: "question",
    ANSWER: "answer",
};
// Difficulty levels
exports.Difficulty = {
    EASY: "easy",
    MEDIUM: "medium",
    HARD: "hard",
};
exports.Role = {
    CANDIDATE: "candidate",
    INTERVIEWER: "interviewer",
};
exports.InterviewStatus = {
    READY: "ready",
    PAUSE: "pause",
    IN_PROGRESS: "in_progress",
    COMPLETED: "completed",
};
