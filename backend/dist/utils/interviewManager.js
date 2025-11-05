"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InterviewManager = exports.difficultyTime = void 0;
const types_1 = require("./types");
exports.difficultyTime = {
    easy: 20,
    medium: 60,
    hard: 120,
};
class InterviewManager {
    questions;
    user;
    status;
    currentIndex;
    constructor(questions, user) {
        this.questions = questions.map((q) => ({
            ...q,
            timeLeft: q.timeLeft ?? exports.difficultyTime[q.difficulty],
        }));
        this.user = user;
        this.status = types_1.InterviewStatus.READY;
        this.currentIndex = 0;
    }
    answer(answer, score = 0) {
        const question = this.questions[this.currentIndex];
        if (!question)
            return false;
        question.answer = answer;
        question.timeLeft = 0;
        question.score = score;
        question.isAnswered = true;
        return true;
    }
    getCurrentQuestion() {
        if (this.status === types_1.InterviewStatus.COMPLETED)
            return null;
        if (this.status === types_1.InterviewStatus.READY) {
            this.status = types_1.InterviewStatus.IN_PROGRESS;
        }
        if (this.status !== types_1.InterviewStatus.IN_PROGRESS)
            return null;
        const question = this.questions[this.currentIndex];
        if (!question) {
            this.status = types_1.InterviewStatus.COMPLETED;
            return null;
        }
        return question;
    }
    getStatus() {
        return this.status;
    }
    pause() {
        if (this.status === types_1.InterviewStatus.IN_PROGRESS) {
            this.status = types_1.InterviewStatus.PAUSE;
        }
    }
    resume() {
        if (this.status === types_1.InterviewStatus.PAUSE) {
            this.status = types_1.InterviewStatus.IN_PROGRESS;
        }
    }
    submit() {
        this.status = types_1.InterviewStatus.COMPLETED;
    }
    getReport() {
        return {
            status: this.status,
            questions: this.questions.map((q) => ({
                id: q.id,
                text: q.text,
                answer: q.answer ?? "",
                score: q.score,
                difficulty: q.difficulty,
                type: q.type,
            })),
        };
    }
    // ✅ Add a new question dynamically
    addQuestion(question) {
        const exists = this.questions.some((q) => q.id === question.id);
        if (exists)
            return;
        if (this.questions.length >= 6) {
            return null; // Do not add if already 6 questions
        }
        const enriched = {
            ...question,
            timeLeft: question.timeLeft ?? exports.difficultyTime[question.difficulty] ?? 60, // default fallback
        };
        this.questions.push(enriched);
        this.currentIndex = this.questions.length - 1;
        return enriched;
    }
}
exports.InterviewManager = InterviewManager;
