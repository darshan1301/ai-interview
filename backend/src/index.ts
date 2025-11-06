import express, { Request, Response } from "express";
import cors from "cors";
import dotenv from "dotenv";
import userRouter from "./routes/user.route";
import { InterviewManager } from "./utils/interviewManager";
import http from "http";
import { setupWebSocketServer } from "./utils/wsManager";
import morgan from "morgan";
import interviewRouter from "./routes/resume.route";
import { clearAllInterviewSessions, getInterviewSession } from "./lib/redis";
import { prisma } from "./lib/db";
import adminRouter from "./routes/admin.route";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

export const interviewSessions = new Map<number, InterviewManager>();

// Middleware
app.use(
  cors({
    origin: process.env.ALLOWED_ORIGIN,
    credentials: true,
  })
);
app.use(morgan("dev"));
app.use(express.json({ limit: "1mb" }));

app.get("/", async (req: Request, res: Response) => {
  res.send("API is health");
});

app.use("/api/user", userRouter);
app.use("/api/resume", interviewRouter);
app.use("/api/admin", adminRouter);

const server = http.createServer(app);

// ✅ Attach WebSocket server
setupWebSocketServer(server);

// Start server
server.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});

server.on("upgrade", (req) => {
  console.log("🔄 WS upgrade request:", req.url);
});
