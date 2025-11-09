import { Request, Response } from "express";
import { prisma } from "../lib/db";

// GET /interviews?page=1
export const getPaginatedInterviews = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string, 10) || 1;
    const pageSize = 10;

    // Use transaction for fewer DB round-trips
    const [data, total] = await prisma.$transaction([
      prisma.interview.findMany({
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { id: "desc" }, // newest first
        select: {
          id: true,
          score: true,
          status: true,
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      }),
      prisma.interview.count(),
    ]);

    res.json({
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
      data: data.map((i) => ({
        candidateId: i.user.id,
        name: i.user.name,
        email: i.user.email,
        interviewId: i.id,
        status: i.status,
        score: i.score,
      })),
    });
  } catch (err) {
    console.error("❌ Failed to fetch interviews:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const getInterviewById = async (req: Request, res: Response) => {
  try {
    const interviewId = req.params.interviewId;
    const interview = await prisma.interview.findUnique({
      where: { id: Number(interviewId) },
      include: { questions: true, user: true },
    });
    if (!interview) {
      return res.status(404).json({ error: "Interview not found" });
    }
    res.json({
      user: {
        id: interview.user.id,
        name: interview.user.name,
        email: interview.user.email,
      },
      interviewId: interview.id,
      status: interview.status,
      summary: interview.summary,
      score: interview.score,
      questions: interview.questions.map((q) => ({
        id: q.id,
        text: q.text,
        answer: q.answer,
        score: q.score,
        difficulty: q.difficulty,
        type: q.type,
      })),
    });
  } catch (err) {
    console.error("❌ Failed to fetch interview:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
