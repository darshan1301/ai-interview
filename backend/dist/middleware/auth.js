"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.isAuthenticated = exports.createToken = void 0;
exports.authRole = authRole;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const cookie_1 = __importDefault(require("cookie"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const createToken = (user) => {
    const tokenPayload = {
        userId: user.userId,
        email: user.email,
        role: user.role,
    };
    return jsonwebtoken_1.default.sign(tokenPayload, process.env.JWT_SECRET, {
        expiresIn: "365d",
    });
};
exports.createToken = createToken;
const isAuthenticated = (req, res, next) => {
    let token;
    if (!token && req.headers.cookie) {
        const cookies = cookie_1.default.parse(req.headers.cookie);
        token = cookies.token; // cookie name: "token"
    }
    if (!token) {
        return res
            .status(401)
            .json({ message: "Unauthorized: You need to log in first" });
    }
    jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err || !decoded || typeof decoded === "string") {
            return res
                .status(403)
                .json({ message: "Token not verified, please login again." });
        }
        req.user = {
            userId: decoded.userId,
            email: decoded.email,
            role: decoded.role,
        };
        next();
    });
};
exports.isAuthenticated = isAuthenticated;
function authRole(...allowedRoles) {
    return (req, res, next) => {
        console.log(req.user);
        if (!req.user || !allowedRoles.includes(req.user.role)) {
            return res.status(403).json({ message: "Access denied" });
        }
        next();
    };
}
