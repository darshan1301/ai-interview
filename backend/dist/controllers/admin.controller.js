"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPaginatedInterviews = void 0;
const db_1 = require("../lib/db");
// GET /interviews?page=1
const getPaginatedInterviews = async (req, res) => {
    try {
        const page = parseInt(req.query.page, 10) || 1;
        const pageSize = 10;
        // Use transaction for fewer DB round-trips
        const [data, total] = await db_1.prisma.$transaction([
            db_1.prisma.interview.findMany({
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
            db_1.prisma.interview.count(),
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
    }
    catch (err) {
        console.error("❌ Failed to fetch interviews:", err);
        res.status(500).json({ error: "Internal Server Error" });
    }
};
exports.getPaginatedInterviews = getPaginatedInterviews;
