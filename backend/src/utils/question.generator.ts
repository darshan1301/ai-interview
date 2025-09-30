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
  type: z.enum(["mcq", "opinion"]),
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
      response_format: zodResponseFormat(QuestionSchema, "question"),
    });

    // Directly return the parsed single question
    const question = completion.choices[0].message.parsed;
    console.log(question);
    return question;
  } catch (error) {
    console.error("❌ Error generating question:", error);
    return null;
  }
}
