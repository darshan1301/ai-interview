"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const user_controller_1 = require("../controllers/user.controller");
const auth_1 = require("../middleware/auth");
const userRouter = (0, express_1.Router)();
// Signup route
userRouter.post("/signup", user_controller_1.userSignup);
// Login route
userRouter.post("/login", user_controller_1.userLogin);
userRouter.get("/me", auth_1.isAuthenticated, (req, res) => {
    if (!req.user) {
        return res.status(401).json({ message: "Not authenticated" });
    }
    res.json({
        user: {
            id: req.user.userId,
            email: req.user.email, // or `req.user.email` depending on payload
            role: req.user.role,
        },
    });
});
exports.default = userRouter;
