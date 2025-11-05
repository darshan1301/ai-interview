"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleResumeUpload = void 0;
const fs_1 = __importDefault(require("fs"));
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
const openai_1 = __importDefault(require("openai"));
const db_1 = require("../lib/db");
const interviewManager_1 = require("../utils/interviewManager");
const redis_1 = require("../lib/redis");
const types_1 = require("../utils/types");
const client = new openai_1.default({ apiKey: process.env.OPENAI_API_KEY });
const handleResumeUpload = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: "No file uploaded" });
        }
        const filePath = path_1.default.resolve(req.file.path);
        // ✅ Upload file to OpenAI
        const file = await client.files.create({
            file: fs_1.default.createReadStream(filePath),
            purpose: "user_data",
        });
        await promises_1.default.unlink(filePath);
        // ✅ Ask OpenAI to parse resume
        const response = await client.responses.create({
            model: "gpt-4.1-mini",
            input: [
                {
                    role: "user",
                    content: [
                        { type: "input_file", file_id: file.id },
                        {
                            type: "input_text",
                            text: 'Extract name, email, and phone. Respond strictly as {"name":"...","email":"...","phone":"..."}',
                        },
                    ],
                },
            ],
        });
        console.log("LLM response:", response.output_text);
        const rawText = response.output_text;
        let parsed = {};
        try {
            parsed = JSON.parse(rawText);
        }
        catch {
            return res.status(500).json({ message: "Could not parse resume fields" });
        }
        // ✅ Validate fields
        const fields = ["name", "email", "phone"];
        const missing = fields.filter((f) => !parsed[f]);
        if (missing.length > 0) {
            return res.status(400).json({ message: "Missing fields", missing });
        }
        // ✅ Store user + interview
        const user = await db_1.prisma.user.findFirst({
            where: { email: req.user?.email },
        });
        if (!user) {
            return res.status(404).json({ message: "No user found with this email" });
        }
        const interview = await db_1.prisma.interview.create({
            data: { userId: user.id, status: types_1.InterviewStatus.READY },
        });
        const prepareUser = {
            id: user.id,
            name: user.name,
            email: user.email,
            phoneNo: parsed.phone,
        };
        const manager = new interviewManager_1.InterviewManager([], prepareUser);
        (0, redis_1.setInterviewSession)(interview.id, manager);
        return res.json({
            message: "Resume parsed successfully",
            startInterview: true,
            interviewId: interview.id,
        });
    }
    catch (err) {
        console.error("❌ Resume upload error:", err);
        return res.status(500).json({ message: "Internal server error" });
    }
};
exports.handleResumeUpload = handleResumeUpload;
