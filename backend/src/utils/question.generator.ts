import OpenAI from "openai";
import { zodResponseFormat } from "openai/helpers/zod";
import { z } from "zod";
import dotenv from "dotenv";

dotenv.config();

const openai = new OpenAI({
  apiKey: process.env["OPENAI_API_KEY"],
});

// Define schema for interview questions
const QuestionSchema = z.object({
  id: z.string(),
  text: z.string(),
  difficulty: z.enum(["easy", "medium", "hard"]),
  type: z.enum(["mcq", "opinion"]),
  options: z.array(z.string()),
});

const QuestionsSchema = z.object({
  questions: z.array(QuestionSchema).length(6),
});

export async function questionGenerator() {
  try {
    const completion = await openai.chat.completions.parse({
      model: "gpt-5-mini-2025-08-07",
      messages: [
        {
          role: "system",
          content:
            "You are an AI interview assistant. Generate exactly 6 interview questions for a full stack (React/Node) role: " +
            "2 easy MCQ questions (with exactly 4 options each), " +
            "2 medium open-ended questions (type=opinion), " +
            "2 hard open-ended questions (type=opinion). " +
            "Return strictly in JSON according to the schema.",
        },
      ],
      response_format: zodResponseFormat(QuestionsSchema, "questions"),
    });

    const questions = completion.choices[0].message.parsed;
    console.log("✅ Generated Questions:", questions);
    return questions;
  } catch (error) {
    console.error("❌ Error generating questions:", error);
    return [];
  }
}
