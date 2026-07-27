import { Request, Response, NextFunction } from "express";
import { MulterError } from "multer";
import { ZodError } from "zod";

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
    if (err instanceof ZodError) {
        const first = err.issues[0];
        return res.status(400).json({
            status: "error",
            statusCode: 400,
            message: first?.message || "Dữ liệu không hợp lệ",
            errors: err.flatten().fieldErrors,
        });
    }

    if (err instanceof MulterError) {
        const message =
            err.code === "LIMIT_FILE_SIZE" ? "Ảnh tối đa 5MB" : `Upload lỗi: ${err.message}`;
        return res.status(400).json({
            status: "error",
            statusCode: 400,
            message,
        });
    }

    const statusCode = err.statusCode || 500;
    const message = err.message || "Lỗi Server Nội Bộ";

    if (statusCode >= 500) {
        console.error("\n=== CÓ LỖI XẢY RA ===");
        console.error(err.stack);
        console.error("======================\n");
    }

    res.status(statusCode).json({
        status: "error",
        statusCode,
        message,
    });
};
