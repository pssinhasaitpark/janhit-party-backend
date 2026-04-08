import multer from "multer";
import path from "path";

const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (req, file, cb) => {
    const allowedTypes = /pdf|doc|docx/;
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.test(ext)) cb(null, true);
    else cb(new Error("Only PDF or Word documents are allowed"));
  },
  limits: { fileSize: 20 * 1024 * 1024 },
});

export default upload;
