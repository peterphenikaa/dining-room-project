import { Request, Response, NextFunction } from "express";

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
    const statusCode = err.statusCode || 500;
    const message = err.message || "Lỗi Server Nội Bộ";

    console.error("\n=== CÓ LỖI XẢY RA ===");
    console.error(err.stack);
    console.error("======================\n");

    res.status(statusCode).json({
        status: "error",
        statusCode,
        message,
    });
};
