import { BaseQuestion, User, InterviewStatus } from "./types";

const difficultyTime: Record<string, number> = {
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
      timeLeft: difficultyTime[q.difficulty],
    }));
    this.user = user;
    this.status = InterviewStatus.READY;
    this.currentIndex = 0;
  }

  decrementTimer() {
    if (this.status !== InterviewStatus.IN_PROGRESS) return 0;

    const question = this.questions[this.currentIndex];
    if (!question) return 0;

    if (question.timeLeft > 0) {
      question.timeLeft--;
    }
    return question.timeLeft;
  }

  answer(answer: string, score: number = 0) {
    const question = this.questions[this.currentIndex];
    if (!question) return null;

    question.answer = answer;
    question.timeLeft = 0;
    question.score = score;

    this.currentIndex++;

    if (this.currentIndex >= this.questions.length) {
      this.status = InterviewStatus.COMPLETED;
      return null;
    }

    return this.questions[this.currentIndex];
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
      user: this.user,
      status: this.status,
      totalScore: this.questions.reduce((sum, q) => sum + q.score, 0),
      questions: this.questions.map((q) => ({
        id: q.id,
        text: q.statement,
        answer: q.answer ?? "",
        score: q.score,
        difficulty: q.difficulty,
      })),
    };
  }
}
