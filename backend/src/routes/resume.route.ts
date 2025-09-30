import { Router } from "express";
import { uploadResume } from "../utils/upload";
import { handleResumeUpload } from "../controllers/resume.controller";
import { isAuthenticated } from "../middleware/auth";

const interviewRouter = Router();

interviewRouter.post(
  "/upload",
  isAuthenticated,
  uploadResume,
  handleResumeUpload
);

export default interviewRouter;
