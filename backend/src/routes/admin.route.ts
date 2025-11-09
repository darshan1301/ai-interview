import { Router } from "express";
import {
  getInterviewById,
  getPaginatedInterviews,
} from "../controllers/admin.controller";
import { authRole, isAuthenticated } from "../middleware/auth";
import { Role } from "../utils/types";

const adminRouter = Router();

// ✅ Get paginated candidates + interview info
adminRouter.get(
  "/list-interviews",
  isAuthenticated,
  authRole(Role.INTERVIEWER),
  getPaginatedInterviews
);

adminRouter.get(
  "/interview/:interviewId",
  isAuthenticated,
  authRole(Role.INTERVIEWER),
  getInterviewById
);

export default adminRouter;
