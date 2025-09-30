import { Request, Response } from "express";
import fs from "fs";
import fsPromises from "fs/promises";
import path from "path";
import OpenAI from "openai";
import { prisma } from "../lib/db";
import { questionGenerator } from "../utils/question.generator";
import { InterviewManager } from "../utils/interviewManager";
import { setInterviewSession } from "../lib/redis";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export const handleResumeUpload = async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const filePath = path.resolve(req.file.path);

    // ✅ Upload file to OpenAI
    const file = await client.files.create({
      file: fs.createReadStream(filePath),
      purpose: "user_data",
    });

    await fsPromises.unlink(filePath);

    // ✅ Ask OpenAI to parse resume
    const response = await client.responses.create({
      model: "gpt-4.1-mini",
      input: [
        {
          role: "user",
          content: [
            { type: "input_file", file_id: file.id },
            {
              type: "input_text",
              text: 'Extract name, email, and phone. Respond strictly as {"name":"...","email":"...","phone":"..."}',
            },
          ],
        },
      ],
    });
    console.log("LLM response:", response.output_text);

    const rawText = response.output_text;
    let parsed: { name?: string; email?: string; phone?: string } = {};
    try {
      parsed = JSON.parse(rawText);
    } catch {
      return res.status(500).json({ message: "Could not parse resume fields" });
    }

    // ✅ Validate fields
    const fields: (keyof typeof parsed)[] = ["name", "email", "phone"];
    const missing = fields.filter((f) => !parsed[f]);
    if (missing.length > 0) {
      return res.status(400).json({ message: "Missing fields", missing });
    }

    // ✅ Store user + interview
    const user = await prisma.user.findFirst({
      where: { email: parsed.email },
    });

    if (!user) {
      return res.status(404).json({ message: "No user found with this email" });
    }

    const interview = await prisma.interview.create({
      data: { userId: user.id, status: "ready" },
    });

    // ✅ Generate and insert 6 questions
    const generated = await questionGenerator();

    // Type guard to ensure we have an object with a questions array
    const hasQuestions = (obj: any): obj is { questions: any[] } =>
      obj && typeof obj === "object" && Array.isArray(obj.questions);

    if (!hasQuestions(generated)) {
      console.error("❌ Question generator returned invalid data:", generated);
      return res.status(500).json({ message: "Question generation failed" });
    }

    await prisma.$transaction(
      generated.questions.map((q: any) =>
        prisma.question.create({
          data: {
            interviewId: interview.id,
            text: q.text,
            difficulty: q.difficulty,
            type: q.type,
            // MCQs get options stored as JSON string
            ...(q.type === "mcq" ? { answer: "", score: 0 } : {}),
          },
        })
      )
    );

    const prepareUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      phoneNo: parsed.phone!,
    };
    // ✅ Put into InterviewManager memory
    const mappedQuestions = generated.questions.map((q: any) => ({
      id: q.id,
      type: q.type,
      difficulty: q.difficulty,
      options: q.options ?? [],
      statement: q.text,
      timeLeft: (q.timeLeft ?? 60) as number,
      isAnswered: (q.isAnswered ?? false) as boolean,
      score: (q.score ?? 0) as number,
    }));
    const manager = new InterviewManager(mappedQuestions, prepareUser);
    setInterviewSession(interview.id, manager);

    return res.json({
      message: "Resume parsed successfully",
      startInterview: true,
      interviewId: interview.id,
    });
  } catch (err) {
    console.error("❌ Resume upload error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};
