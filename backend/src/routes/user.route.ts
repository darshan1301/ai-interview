import { Request, Router } from "express";
import { userLogin, userSignup } from "../controllers/user.controller";
import { isAuthenticated } from "../middleware/auth";
import { Response } from "express";

const userRouter = Router();

// Signup route
userRouter.post("/signup", userSignup);

// Login route
userRouter.post("/login", userLogin);

userRouter.get("/me", isAuthenticated, (req: Request, res: Response) => {
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

export default userRouter;
