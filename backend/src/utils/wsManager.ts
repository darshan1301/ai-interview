import WebSocket, { WebSocketServer } from "ws";
import { Server } from "http";
import { handleWSMessage } from "./wsMessageHandler";
import cookie from "cookie";
import jwt, { JwtPayload } from "jsonwebtoken";
import { ServerMessageType } from "./messages.types";
// Extend WebSocket type to include user info
export interface AuthenticatedWebSocket extends WebSocket {
  user?: {
    userId: number;
    email: string;
    role: string;
  };
  interviewId?: number;
  ticker?: NodeJS.Timeout;
}

// Map of connected clients by userId
const clients = new Map<number, AuthenticatedWebSocket>();
let wss: WebSocketServer | null = null;

export function setupWebSocketServer(server: Server) {
  wss = new WebSocketServer({ server, path: "/ws" });

  wss.on("connection", (ws: AuthenticatedWebSocket, req) => {
    console.log("New WebSocket connection...");

    // ✅ Parse cookies from headers
    const cookies = cookie.parse(req.headers.cookie || "");
    const token = cookies.token;

    if (!token) {
      ws.send(JSON.stringify({ type: "error", payload: "No auth token" }));
      ws.close();
      return;
    }

    // ✅ Verify JWT immediately on connection
    jwt.verify(token, process.env.JWT_SECRET as string, (err, decoded) => {
      if (err || !decoded || typeof decoded === "string") {
        ws.send(JSON.stringify({ type: "error", payload: "Invalid token" }));
        console.log("CLOSED");
        ws.close();
        return;
      }

      const payload = decoded as JwtPayload & {
        userId: number;
        email: string;
        role: string;
      };

      ws.user = {
        userId: payload.userId,
        email: payload.email,
        role: payload.role,
      };

      clients.set(payload.userId, ws);

      if (!ws.ticker) {
        ws.ticker = setInterval(() => {
          ws.send(
            JSON.stringify({
              type: ServerMessageType.INFO,
              payload: `Server time: ${new Date().toLocaleTimeString("en-US", {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
              })}`,
            })
          );
        }, 1000);
      }
    });

    ws.on("message", (message: WebSocket.RawData) => {
      console.log("MESSAGE");
      handleWSMessage(ws, message.toString());
    });

    ws.on("close", () => {
      if (ws.ticker) {
        clearInterval(ws.ticker);
        ws.ticker = undefined;
      }
      if (ws.user?.userId) {
        clients.delete(ws.user.userId);
        console.log(`WebSocket closed for user ${ws.user.userId}`);
      }
    });
  });
}

export function sendToUser(userId: number, message: object) {
  const client = clients.get(userId);
  if (client && client.readyState === WebSocket.OPEN) {
    client.send(JSON.stringify(message));
  } else {
    console.warn(`❌ No active WebSocket for user ${userId}`);
  }
}

export function getClients() {
  return clients;
}
