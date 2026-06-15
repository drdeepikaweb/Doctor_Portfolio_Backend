import multer from "multer";

const allowedMimeTypes = ["application/pdf", "image/jpeg", "image/png"];

export const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!allowedMimeTypes.includes(file.mimetype)) {
      cb(new Error("Only PDF, JPG, and PNG files are allowed"));
      return;
    }
    cb(null, true);
  },
});
