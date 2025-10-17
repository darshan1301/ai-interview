import { BaseQuestion, User, InterviewStatus } from "./types";

export const difficultyTime: Record<string, number> = {
  easy: 20,
  medium: 60,
  hard: 120,
};

export class InterviewManager {
  questions: BaseQuestion[];
  user: User;
  status: InterviewStatus;
  currentIndex: number;

  constructor(questions: BaseQuestion[], user: User) {
    this.questions = questions.map((q) => ({
      ...q,
      timeLeft: q.timeLeft ?? difficultyTime[q.difficulty],
    }));
    this.user = user;
    this.status = InterviewStatus.READY;
    this.currentIndex = 0;
  }

  answer(answer: string, score: number = 0) {
    const question = this.questions[this.currentIndex];
    if (!question) return false;

    question.answer = answer;
    question.timeLeft = 0;
    question.score = score;
    question.isAnswered = true;
    return true;
  }

  getCurrentQuestion() {
    if (this.status === InterviewStatus.COMPLETED) return null;

    if (this.status === InterviewStatus.READY) {
      this.status = InterviewStatus.IN_PROGRESS;
    }

    if (this.status !== InterviewStatus.IN_PROGRESS) return null;

    const question = this.questions[this.currentIndex];
    if (!question) {
      this.status = InterviewStatus.COMPLETED;
      return null;
    }

    return question;
  }

  getStatus() {
    return this.status;
  }

  pause() {
    if (this.status === InterviewStatus.IN_PROGRESS) {
      this.status = InterviewStatus.PAUSE;
    }
  }

  resume() {
    if (this.status === InterviewStatus.PAUSE) {
      this.status = InterviewStatus.IN_PROGRESS;
    }
  }

  submit() {
    this.status = InterviewStatus.COMPLETED;
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
  addQuestion(question: BaseQuestion) {
    const exists = this.questions.some((q) => q.id === question.id);
    if (exists) return;

    if (this.questions.length >= 6) {
      return null; // Do not add if already 6 questions
    }

    const enriched = {
      ...question,
      timeLeft: question.timeLeft ?? difficultyTime[question.difficulty] ?? 60, // default fallback
    };

    this.questions.push(enriched);

    this.currentIndex = this.questions.length - 1;

    return enriched;
  }
}
