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
