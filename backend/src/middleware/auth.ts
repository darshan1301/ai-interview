import { Request, Response, NextFunction } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import cookie from "cookie";
import dotenv from "dotenv";

dotenv.config();

interface UserPayload {
  userId: number;
  email: string;
  role: string;
}

export const createToken = (user: UserPayload): string => {
  const tokenPayload: UserPayload = {
    userId: user.userId,
    email: user.email,
    role: user.role,
  };

  return jwt.sign(tokenPayload, process.env.JWT_SECRET as string, {
    expiresIn: "365d",
  });
};

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: UserPayload;
    }
  }
}

export const isAuthenticated = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let token: string | undefined;

  if (!token && req.headers.cookie) {
    const cookies = cookie.parse(req.headers.cookie);
    token = cookies.token; // cookie name: "token"
  }

  if (!token) {
    return res
      .status(401)
      .json({ message: "Unauthorized: You need to log in first" });
  }

  jwt.verify(token, process.env.JWT_SECRET as string, (err, decoded) => {
    if (err || !decoded || typeof decoded === "string") {
      return res
        .status(403)
        .json({ message: "Token not verified, please login again." });
    }

    req.user = {
      userId: (decoded as JwtPayload).userId,
      email: (decoded as JwtPayload).email,
      role: (decoded as JwtPayload).role,
    };

    next();
  });
};

export function authRole(...allowedRoles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    console.log(req.user);
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: "Access denied" });
    }
    next();
  };
}
