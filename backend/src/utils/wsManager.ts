import WebSocket, { WebSocketServer } from "ws";
import { Server } from "http";
import { handleWSMessage } from "./wsMessageHandler";
import cookie from "cookie";
import jwt, { JwtPayload } from "jsonwebtoken";
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

      ws.send(JSON.stringify({ type: "auth_success" }));
    });

    ws.on("message", (message: WebSocket.RawData) => {
      handleWSMessage(ws, message.toString());
    });

    ws.on("close", () => {
      if (ws.user?.userId) {
        clients.delete(ws.user.userId);
        console.log(`WebSocket closed for user ${ws.user.userId}`);
      }
    });
  });
}

export function getClients() {
  return clients;
}
