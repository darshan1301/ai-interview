import { atom } from "recoil";

export type InterviewStatus = "ready" | "in_progress" | "pause" | "completed";

export interface Question {
  id: string;
  text: string;
  answer: string | null;
  difficulty: "easy" | "medium" | "hard";
  type: "mcq" | "opinion";
  options: string[];
  timeLeft: number;
}

const persist = <T>(key: string, defaultValue: T): T => {
  const saved = localStorage.getItem(key);
  return saved ? (JSON.parse(saved) as T) : defaultValue;
};

export const interviewIdState = atom<string | null>({
  key: "interviewIdState",
  default: persist("interviewId", null),
  effects: [
    ({ onSet }) => {
      onSet((val) =>
        val
          ? localStorage.setItem("interviewId", JSON.stringify(val))
          : localStorage.removeItem("interviewId")
      );
    },
  ],
});

export const questionsState = atom<Question[]>({
  key: "questionsState",
  default: [],
});

export const currentIndexState = atom<number>({
  key: "currentIndexState",
  default: persist("currentIndex", 0),
  effects: [
    ({ onSet }) => {
      onSet((val) => localStorage.setItem("currentIndex", JSON.stringify(val)));
    },
  ],
});

export const statusState = atom<InterviewStatus>({
  key: "statusState",
  default: persist("status", "ready"),
  effects: [
    ({ onSet }) => {
      onSet((val) => localStorage.setItem("status", JSON.stringify(val)));
    },
  ],
});
