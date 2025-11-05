"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CompletedResponseSchema = void 0;
exports.questionGenerator = questionGenerator;
exports.evaluateInterview = evaluateInterview;
const openai_1 = __importDefault(require("openai"));
const zod_1 = require("openai/helpers/zod");
const zod_2 = require("zod");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const openai = new openai_1.default({
    apiKey: process.env["OPENAI_API_KEY"],
});
// Define schema for a single interview question
const QuestionSchema = zod_2.z.object({
    id: zod_2.z.number(),
    text: zod_2.z.string(),
    difficulty: zod_2.z.enum(["easy", "medium", "hard"]),
    type: zod_2.z.enum(["opinion", "MCQ"]),
    options: zod_2.z.array(zod_2.z.string()),
});
async function questionGenerator(askedQuestions) {
    try {
        // ✅ Only include context if we actually have askedQuestions
        const userContent = askedQuestions && askedQuestions.length > 0
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
            response_format: (0, zod_1.zodResponseFormat)(QuestionSchema, "question"),
        });
        // Directly return the parsed single question
        const question = completion.choices[0].message.parsed;
        return question;
    }
    catch (error) {
        console.error("❌ Error generating question:", error);
        return null;
    }
}
// Schema for a scored question
const ScoredQuestionSchema = zod_2.z.object({
    id: zod_2.z.number(),
    text: zod_2.z.string(),
    answer: zod_2.z.string().nullable(),
    score: zod_2.z.number().min(0).max(10),
    difficulty: zod_2.z.enum(["easy", "medium", "hard"]),
    type: zod_2.z.enum(["opinion", "MCQ"]),
});
// Schema for the completed response
exports.CompletedResponseSchema = zod_2.z.object({
    type: zod_2.z.literal("COMPLETED"),
    status: zod_2.z.enum(["READY", "IN_PROGRESS", "PAUSE", "COMPLETED"]),
    summary: zod_2.z.string(), // ✅ extra field for LLM-generated summary
    questions: zod_2.z.array(ScoredQuestionSchema),
    score: zod_2.z.number().min(1).max(100),
});
async function evaluateInterview(interview) {
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
        response_format: (0, zod_1.zodResponseFormat)(exports.CompletedResponseSchema, "completed_response"),
    });
    const parsed = completion.choices[0].message.parsed;
    return parsed;
}
