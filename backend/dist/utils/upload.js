"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadResume = void 0;
const multer_1 = __importDefault(require("multer"));
// store in "uploads/" folder temporarily
const storage = multer_1.default.diskStorage({
    destination: "uploads/",
    filename: (_req, file, cb) => {
        cb(null, Date.now() + "-" + file.originalname);
    },
});
// Accept only PDF and DOCX
const fileFilter = (_req, file, cb) => {
    if (file.mimetype === "application/pdf" ||
        file.mimetype ===
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
        cb(null, true);
    }
    else {
        cb(new Error("Only PDF and DOCX files are allowed"));
    }
};
exports.uploadResume = (0, multer_1.default)({ storage, fileFilter }).single("resume");
