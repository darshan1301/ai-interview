"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.questionGenerator = questionGenerator;
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
    difficulty: zod_2.z.enum(["easy"]),
    type: zod_2.z.enum(["opinion"]),
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
                    content: `You are an AI interview assistant. Generate exactly 1 new interview question for a full stack (React/Node) role.
            
            Rules:
            - Avoid repeating or being too similar to previously asked questions (if provided).
            - Maintain a mix of difficulties and types.
            - Use 'mcq' for multiple choice (with exactly 4 options).
            - Use 'opinion' for open-ended.
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
        console.log("GENERATOR", question);
        return question;
    }
    catch (error) {
        console.error("❌ Error generating question:", error);
        return null;
    }
}
