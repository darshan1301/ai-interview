"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const admin_controller_1 = require("../controllers/admin.controller");
const auth_1 = require("../middleware/auth");
const types_1 = require("../utils/types");
const adminRouter = (0, express_1.Router)();
// ✅ Get paginated candidates + interview info
adminRouter.get("/interviews", auth_1.isAuthenticated, (0, auth_1.authRole)(types_1.Role.INTERVIEWER), admin_controller_1.getPaginatedInterviews);
exports.default = adminRouter;
