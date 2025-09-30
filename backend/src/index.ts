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

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

export const interviewSessions = new Map<number, InterviewManager>();

// Middleware
app.use(
  cors({
    origin: true,
    credentials: true,
  })
);
app.use(morgan("dev"));
app.use(express.json({ limit: "1mb" }));

app.get("/", async (req: Request, res: Response) => {
  let data = await getInterviewSession(1);
  // await clearAllInterviewSessions();
  res.json(data);

  // res.send(`✅ Server is running!`);
});

app.use("/api/user", userRouter);
app.use("/api/resume", interviewRouter);

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
