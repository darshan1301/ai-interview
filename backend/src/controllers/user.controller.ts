import { Response, Request } from "express";
import { createToken } from "../middleware/auth";
import { prisma } from "../lib/db";
import bcrypt from "bcryptjs";
import { Role } from "../../generated/prisma";

export async function userLogin(req: Request, res: Response) {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res
        .status(404)
        .json({ message: "User not found. Please signup first." });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = createToken({
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
  } catch (error) {
    console.error("❌ Login error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

export async function userSignup(req: Request, res: Response) {
  try {
    const { email, password, adminSecret, name } = req.body;

    // 1. Check if user already exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    // 2. Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // 3. Decide role
    const role =
      adminSecret && adminSecret === process.env.ADMIN_SECRET
        ? Role.INTERVIEWER
        : Role.CANDIDATE;

    // 4. Create user in DB
    const user = await prisma.user.create({
      data: {
        email,
        name: name || email.split("@")[0], // fallback if name missing
        password: hashedPassword,
        role,
      },
    });

    // 5. Create token
    const token = createToken({
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
  } catch (error) {
    console.error("❌ Signup error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}
