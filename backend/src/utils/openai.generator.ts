import OpenAI from "openai";
import { zodResponseFormat } from "openai/helpers/zod";
import { z } from "zod";
import dotenv from "dotenv";

dotenv.config();

const openai = new OpenAI({
  apiKey: process.env["OPENAI_API_KEY"],
});

// Define schema for a single interview question
const QuestionSchema = z.object({
  id: z.number(),
  text: z.string(),
  difficulty: z.enum(["easy", "medium", "hard"]),
  type: z.enum(["opinion", "MCQ"]),
  options: z.array(z.string()),
});

export async function questionGenerator(
  askedQuestions?: Array<{
    id: number;
    text: string;
    difficulty: string;
    type: string;
  }>
) {
  try {
    // ✅ Only include context if we actually have askedQuestions
    const userContent =
      askedQuestions && askedQuestions.length > 0
        ? `Previously asked questions:\n${askedQuestions
            .map((q) => `- (${q.difficulty}/${q.type}) ${q.text}`)
            .join("\n")}\n\nNow generate 1 new question.`
        : `Generate 1 new question.`;

    const completion = await openai.chat.completions.parse({
      model: "gpt-5-mini-2025-08-07",
      messages: [
        {
          role: "system",
          content: `
          You are an AI interview assistant. Generate exactly 1 fair and practical interview question for a Full Stack (React + Node.js) role.

          🎯 Target:
          - Candidates with **0–1 year of experience**.
          - Focus on **core fundamentals**, **basic reasoning**, and **real-world developer tasks**.
          - Avoid complex system design, scaling, or obscure APIs.
          - Keep tone friendly, supportive, and beginner-appropriate.

          ⚙️ Rules:
          - Do not repeat or closely resemble previously asked questions (if provided).
          - Maintain a variety across 2 easy, 2 medium, and 2 hard questions overall.
          - Questions must be **answerable within 20–120 seconds**, depending on difficulty:
            - Easy: 20–45 seconds (basic concept check)
            - Medium: 45–90 seconds (simple reasoning or short code logic)
            - Hard: 90–120 seconds (slightly analytical or scenario-based)
          - Use **'MCQ'** for multiple-choice questions (exactly 4 clear and distinct options, one correct).
          - Use **'opinion'** for short, open-ended reasoning (should be answerable in 2–4 sentences).
          - Every question must be **answerable without internet access** and based on reasoning, not memorization.
          - Ensure all wording is **clear, human, and non-intimidating** — make it feel like a real interview conversation.
          - Prefer topics like:
            - React basics (state, props, hooks, lifecycle)
            - Node.js fundamentals (routing, async logic, middleware)
            - JS/TS concepts (scope, promises, array methods)
            - Basic debugging or practical coding judgment

          🧩 Output Format:
          Return the output strictly following the given schema (do not add new fields).
          However, the **text field** must contain **HTML with TailwindCSS classes** representing the question block.

          💡 HTML Style Guide:
          - Wrap everything inside a container:
            \`<div class="p-4 rounded-xl border border-gray-200 bg-white shadow-sm">\`
          - Show difficulty as a colored badge (green for easy, yellow for medium, red for hard).
          - For MCQs, include options as:
            \`<ul class="mt-3 space-y-2">\` with \`<li class="p-2 border rounded hover:bg-gray-50">\`
          - For opinion questions, add a note like: “💬 Write your answer below...”.
          - Keep text readable and modern — no inline styles, Tailwind only.
          - Example for medium MCQ:

          <div class="p-4 rounded-xl border bg-white shadow-sm">
            <div class="flex items-center justify-between">
              <h2 class="text-lg font-semibold text-gray-800">What is the difference between props and state in React?</h2>
            </div>
            <ul class="mt-3 space-y-2">
              <li class="p-2 border rounded hover:bg-gray-50">A) Props are mutable, state is immutable</li>
              <li class="p-2 border rounded hover:bg-gray-50">B) Props are immutable, state is mutable</li>
              <li class="p-2 border rounded hover:bg-gray-50">C) Both are mutable</li>
              <li class="p-2 border rounded hover:bg-gray-50">D) Both are immutable</li>
            </ul>
          </div>

          Return this full HTML string inside the \`text\` field of the schema.
          `,
        },
        {
          role: "user",
          content: userContent,
        },
      ],
      response_format: zodResponseFormat(QuestionSchema, "question"),
    });

    // Directly return the parsed single question
    const question = completion.choices[0].message.parsed;

    return question;
  } catch (error) {
    console.error("❌ Error generating question:", error);
    return null;
  }
}

// Schema for a scored question
const ScoredQuestionSchema = z.object({
  id: z.number(),
  text: z.string(),
  answer: z.string().nullable(),
  score: z.number().min(0).max(10),
  difficulty: z.enum(["easy", "medium", "hard"]),
  type: z.enum(["opinion", "MCQ"]),
});

// Schema for the completed response
export const CompletedResponseSchema = z.object({
  type: z.literal("COMPLETED"),
  status: z.enum(["READY", "IN_PROGRESS", "PAUSE", "COMPLETED"]),
  summary: z.string(), // ✅ extra field for LLM-generated summary
  questions: z.array(ScoredQuestionSchema),
  score: z.number().min(1).max(100),
});

export async function evaluateInterview(interview: {
  questions: {
    id: number;
    text: string;
    difficulty: string;
    type: string;
    answer: string | null;
    score: number;
    interviewId: number;
    isAnswered: boolean;
  }[];
}) {
  const completion = await openai.chat.completions.parse({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: `
        You are an AI interview evaluator for a Full Stack (React/Node.js) role.

        🎯 Objective:
        Evaluate the candidate's overall interview performance (not individual questions).  
        You must return only:
        - A holistic **interview score** from 0–100  
        - A **summary** paragraph (2–3 sentences) describing their performance.

        ⚙️ Evaluation Criteria:
        - Accuracy and clarity of answers  
        - Practical understanding of fundamentals (React, Node.js, JS/TS)  
        - Communication and reasoning quality  
        - Completeness of responses  
        - Ability to apply knowledge logically  

        Scoring guidance:
        - 0–39 → Weak understanding or incomplete answers  
        - 40–59 → Basic familiarity, some gaps in clarity or confidence  
        - 60–79 → Solid foundation with room to improve depth  
        - 80–89 → Strong understanding and good reasoning  
        - 90–100 → Excellent clarity, confidence, and strong applied knowledge  

        🧮 Important:
        - You are evaluating the **entire interview session** as one unit.
        - You are NOT assigning per-question scores.
        - Always include a numeric \`score\` field (1–100) and a concise \`summary\` string.
        - Do NOT omit or set score to 0.
        - Be encouraging, balanced, and fair in tone.

        Return the final output strictly matching this schema:
        {
          "type": "COMPLETED",
          "status": "COMPLETED",
          "summary": "...",
          "questions": [...same as input...],
          "score": 85
        }
                `,
      },
      {
        role: "user",
        content: JSON.stringify(interview.questions, null, 2),
      },
    ],
    response_format: zodResponseFormat(
      CompletedResponseSchema,
      "completed_response"
    ),
  });

  const parsed = completion.choices[0].message.parsed;

  return parsed;
}
