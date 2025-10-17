"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.interviewSessions = void 0;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const user_route_1 = __importDefault(require("./routes/user.route"));
const http_1 = __importDefault(require("http"));
const wsManager_1 = require("./utils/wsManager");
const morgan_1 = __importDefault(require("morgan"));
const resume_route_1 = __importDefault(require("./routes/resume.route"));
const redis_1 = require("./lib/redis");
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 5000;
exports.interviewSessions = new Map();
// Middleware
app.use((0, cors_1.default)({
    origin: true,
    credentials: true,
}));
app.use((0, morgan_1.default)("dev"));
app.use(express_1.default.json({ limit: "1mb" }));
app.get("/:interviewId", async (req, res) => {
    let data = await (0, redis_1.getInterviewSession)(Number(req.params.interviewId));
    // await clearAllInterviewSessions();
    res.json(data);
    // res.send(`✅ Server is running!`);
});
app.use("/api/user", user_route_1.default);
app.use("/api/resume", resume_route_1.default);
const server = http_1.default.createServer(app);
// ✅ Attach WebSocket server
(0, wsManager_1.setupWebSocketServer)(server);
// Start server
server.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});
server.on("upgrade", (req) => {
    console.log("🔄 WS upgrade request:", req.url);
});
