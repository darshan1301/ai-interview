import { Router } from "express";
import { getPaginatedInterviews } from "../controllers/admin.controller";
import { authRole, isAuthenticated } from "../middleware/auth";
import { Role } from "../utils/types";

const adminRouter = Router();

// ✅ Get paginated candidates + interview info
adminRouter.get(
  "/interviews",
  isAuthenticated,
  authRole(Role.INTERVIEWER),
  getPaginatedInterviews
);

export default adminRouter;
