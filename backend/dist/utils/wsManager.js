"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupWebSocketServer = setupWebSocketServer;
exports.sendToUser = sendToUser;
exports.getClients = getClients;
const ws_1 = __importStar(require("ws"));
const wsMessageHandler_1 = require("./wsMessageHandler");
const cookie_1 = __importDefault(require("cookie"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
// Map of connected clients by userId
const clients = new Map();
let wss = null;
function setupWebSocketServer(server) {
    wss = new ws_1.WebSocketServer({ server, path: "/ws" });
    wss.on("connection", (ws, req) => {
        console.log("New WebSocket connection...");
        // ✅ Parse cookies from headers
        const cookies = cookie_1.default.parse(req.headers.cookie || "");
        const token = cookies.token;
        if (!token) {
            ws.send(JSON.stringify({ type: "error", payload: "No auth token" }));
            ws.close();
            return;
        }
        // ✅ Verify JWT immediately on connection
        jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET, (err, decoded) => {
            if (err || !decoded || typeof decoded === "string") {
                ws.send(JSON.stringify({ type: "error", payload: "Invalid token" }));
                console.log("CLOSED");
                ws.close();
                return;
            }
            const payload = decoded;
            ws.user = {
                userId: payload.userId,
                email: payload.email,
                role: payload.role,
            };
            clients.set(payload.userId, ws);
        });
        ws.on("message", (message) => {
            console.log("MESSAGE", message.toString());
            (0, wsMessageHandler_1.handleWSMessage)(ws, message.toString());
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
function sendToUser(userId, message) {
    const client = clients.get(userId);
    if (client && client.readyState === ws_1.default.OPEN) {
        client.send(JSON.stringify(message));
    }
    else {
        console.warn(`❌ No active WebSocket for user ${userId}`);
    }
}
function getClients() {
    return clients;
}
