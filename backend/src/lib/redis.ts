// src/interviewSessions.ts
import { createClient } from "redis";
import { InterviewManager } from "../utils/interviewManager";

const redis = createClient({
  username: process.env.REDIS_USERNAME || "default",
  password: process.env.REDIS_PASSWORD,
  socket: {
    host: process.env.REDIS_HOST,
    port: Number(process.env.REDIS_PORT),
  },
});

redis.on("error", (err) => console.error("❌ Redis Error", err));

let isReady = false;
async function connect() {
  if (!isReady) {
    await redis.connect();
    isReady = true;
    console.log("✅ Redis connected for interviewSessions");
  }
}

// Save
export async function setInterviewSession(
  id: number,
  manager: InterviewManager
) {
  await connect();
  await redis.set(`interview:${id}`, JSON.stringify(manager));
}

// Get
export async function getInterviewSession(
  id: number
): Promise<InterviewManager | null> {
  await connect();
  const data = await redis.get(`interview:${id}`);
  if (!data) return null;

  // revive InterviewManager with methods
  const parsed = JSON.parse(data);
  return new InterviewManager(parsed.questions, parsed.user);
}

// Delete
export async function deleteInterviewSession(id: number) {
  await connect();
  await redis.del(`interview:${id}`);
}
