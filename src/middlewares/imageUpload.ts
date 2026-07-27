import multer from "multer";
import { AppError } from "../utils/AppError";

const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

export const imageUpload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (_req, file, cb) => {
        if (!ALLOWED.has(file.mimetype)) {
            cb(new AppError("Chỉ chấp nhận ảnh JPEG/PNG/WebP/GIF", 400));
            return;
        }
        cb(null, true);
    },
});
