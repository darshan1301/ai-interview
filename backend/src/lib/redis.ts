// src/interviewSessions.ts
import { createClient } from "redis";
import { InterviewManager } from "../utils/interviewManager";

const redis = createClient({
  username: process.env.REDIS_USERNAME || "default",
  password: process.env.REDIS_PASSWORD,
  socket: {
    host: process.env.REDIS_HOST,
    port: Number(process.env.REDIS_PORT),
    reconnectStrategy: (retries) => {
      console.warn(`🔄 Redis reconnect attempt #${retries}`);
      // retry after 2s, but cap to avoid tight loops
      return Math.min(retries * 200, 2000);
    },
  },
});

redis.on("error", (err) => console.error("❌ Redis Error", err));
redis.on("connect", () => console.log("🔌 Redis connecting..."));
redis.on("ready", () => console.log("✅ Redis ready"));
redis.on("end", () => console.warn("🔴 Redis connection closed"));

async function connect() {
  if (!redis.isOpen) {
    await redis.connect();
    console.log("✅ Redis connected for interviewSessions");
  }
}

// Save
export async function setInterviewSession(
  id: number,
  manager: InterviewManager
) {
  await connect();

  const state = {
    questions: manager.questions,
    user: manager.user,
    status: manager.status,
    currentIndex: manager.currentIndex,
  };
  console.log("MANAGER STATE TO SAVE:", state.status);

  await redis.set(`interview:${id}`, JSON.stringify(state));
}

/// Get
export async function getInterviewSession(
  id: number
): Promise<InterviewManager | null> {
  await connect();
  const data = await redis.get(`interview:${id}`);
  if (!data) return null;

  const parsed = JSON.parse(data);

  console.log("PARSED INTERVIEW SESSION:", parsed.status);

  // Properly rehydrate manager
  const mgr = new InterviewManager(parsed.questions, parsed.user);
  mgr.status = parsed.status;
  mgr.currentIndex = parsed.currentIndex;
  return mgr;
}

//clear all
export async function clearAllInterviewSessions() {
  await connect();
  const keys = await redis.keys("interview:*");
  if (keys.length > 0) {
    await redis.del(keys);
    console.log(`🗑️ Cleared ${keys.length} interview sessions from Redis`);
  } else {
    console.log("🗑️ No interview sessions to clear from Redis");
  }
}

// Delete
export async function deleteInterviewSession(id: number) {
  await connect();
  await redis.del(`interview:${id}`);
}

// Graceful shutdown
process.on("SIGINT", async () => {
  if (redis.isOpen) {
    await redis.quit();
    console.log("🛑 Redis disconnected cleanly");
  }
  process.exit(0);
});
