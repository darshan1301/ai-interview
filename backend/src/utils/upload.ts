import multer from "multer";

// store in "uploads/" folder temporarily
const storage = multer.diskStorage({
  destination: "uploads/",
  filename: (_req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

// Accept only PDF and DOCX
const fileFilter: multer.Options["fileFilter"] = (_req, file, cb) => {
  if (
    file.mimetype === "application/pdf" ||
    file.mimetype ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ) {
    cb(null, true);
  } else {
    cb(new Error("Only PDF and DOCX files are allowed"));
  }
};

export const uploadResume = multer({ storage, fileFilter }).single("resume");
