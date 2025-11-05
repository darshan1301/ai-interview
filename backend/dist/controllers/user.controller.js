"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.userLogin = userLogin;
exports.userSignup = userSignup;
const auth_1 = require("../middleware/auth");
const db_1 = require("../lib/db");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const prisma_1 = require("../../generated/prisma");
async function userLogin(req, res) {
    try {
        const { email, password } = req.body;
        const user = await db_1.prisma.user.findUnique({ where: { email } });
        if (!user) {
            return res
                .status(404)
                .json({ message: "User not found. Please signup first." });
        }
        const isMatch = await bcryptjs_1.default.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: "Invalid credentials" });
        }
        const token = (0, auth_1.createToken)({
            userId: user.id,
            email: user.email,
            role: user.role,
        });
        res.cookie("token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
            domain: process.env.NODE_ENV === "production" ? ".devdm.xyz" : undefined,
            maxAge: 365 * 24 * 60 * 60 * 1000,
        });
        return res.json({
            message: "Login successful",
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
            },
        });
    }
    catch (error) {
        console.error("❌ Login error:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}
async function userSignup(req, res) {
    try {
        const { email, password, adminSecret, name } = req.body;
        // 1. Check if user already exists
        const existingUser = await db_1.prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ message: "User already exists" });
        }
        // 2. Hash password
        const hashedPassword = await bcryptjs_1.default.hash(password, 10);
        // 3. Decide role
        const role = adminSecret && adminSecret === process.env.ADMIN_SECRET
            ? prisma_1.Role.INTERVIEWER
            : prisma_1.Role.CANDIDATE;
        // 4. Create user in DB
        const user = await db_1.prisma.user.create({
            data: {
                email,
                name: name || email.split("@")[0], // fallback if name missing
                password: hashedPassword,
                role,
            },
        });
        // 5. Create token
        const token = (0, auth_1.createToken)({
            userId: user.id,
            email: user.email,
            role: user.role,
        });
        // 6. Set token in cookie
        res.cookie("token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
            domain: process.env.NODE_ENV === "production" ? ".devdm.xyz" : undefined,
            maxAge: 365 * 24 * 60 * 60 * 1000,
        });
        return res.status(201).json({
            message: "Signup successful",
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
            },
        });
    }
    catch (error) {
        console.error("❌ Signup error:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}
