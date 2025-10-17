"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InterviewManager = void 0;
const types_1 = require("./types");
const difficultyTime = {
    easy: 5,
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
            timeLeft: q.timeLeft ?? difficultyTime[q.difficulty],
        }));
        this.user = user;
        this.status = types_1.InterviewStatus.READY;
        this.currentIndex = 0;
    }
    decrementTimer() {
        if (this.status !== types_1.InterviewStatus.IN_PROGRESS)
            return 0;
        const question = this.questions[this.currentIndex];
        if (!question)
            return 0;
        if (question.timeLeft > 0) {
            question.timeLeft--;
        }
        return question.timeLeft;
    }
    answer(answer, score = 0) {
        const question = this.questions[this.currentIndex];
        if (!question)
            return null;
        question.answer = answer;
        question.timeLeft = 0;
        question.score = score;
        question.isAnswered = true;
        this.currentIndex++;
        // ❌ Do NOT mark completed here
        // Just return next if available, else null
        return this.questions[this.currentIndex] ?? null;
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
            user: this.user,
            status: this.status,
            totalScore: this.questions.reduce((sum, q) => sum + q.score, 0),
            questions: this.questions.map((q) => ({
                id: q.id,
                text: q.text,
                answer: q.answer ?? "",
                score: q.score,
                difficulty: q.difficulty,
            })),
        };
    }
    // ✅ Add a new question dynamically
    addQuestion(question) {
        // 1. Avoid duplicates by ID
        const exists = this.questions.some((q) => q.id === question.id);
        if (exists)
            return;
        // 2. Enforce max length (<= 6)
        if (this.questions.length >= 6) {
            this.questions.shift(); // remove oldest if you want sliding window
        }
        // 3. Add new with timeLeft if not set
        this.questions.push({
            ...question,
            timeLeft: question.timeLeft ?? difficultyTime[question.difficulty],
        });
    }
}
exports.InterviewManager = InterviewManager;
