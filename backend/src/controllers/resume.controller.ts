import { Request, Response } from "express";
import fs from "fs";
import fsPromises from "fs/promises";
import path from "path";
import OpenAI from "openai";
import { prisma } from "../lib/db";
import { InterviewManager } from "../utils/interviewManager";
import { setInterviewSession } from "../lib/redis";
import { InterviewStatus } from "../utils/types";

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
      where: { email: req.user?.email },
    });

    if (!user) {
      return res.status(404).json({ message: "No user found with this email" });
    }

    const interview = await prisma.interview.create({
      data: { userId: user.id, status: InterviewStatus.READY },
    });

    const prepareUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      phoneNo: parsed.phone!,
    };

    const manager = new InterviewManager([], prepareUser);
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
