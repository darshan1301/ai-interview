"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const upload_1 = require("../utils/upload");
const resume_controller_1 = require("../controllers/resume.controller");
const auth_1 = require("../middleware/auth");
const interviewRouter = (0, express_1.Router)();
interviewRouter.post("/upload", auth_1.isAuthenticated, upload_1.uploadResume, resume_controller_1.handleResumeUpload);
exports.default = interviewRouter;
