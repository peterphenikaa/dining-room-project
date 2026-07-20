import { NextFunction, Response } from "express";
import { AuthRequest } from "../types/auth";
import { AppError } from "../utils/AppError";
import { ACCESS_COOKIE } from "../utils/authCookie";
import { verifyAccessToken } from "../utils/jwt";

function extractAccessToken(req: AuthRequest): string | null {
    const fromCookie = req.cookies?.[ACCESS_COOKIE];
    if (typeof fromCookie === "string" && fromCookie.length > 0) {
        return fromCookie;
    }

    const header = req.headers.authorization;
    if (header?.startsWith("Bearer ")) {
        return header.slice(7);
    }

    return null;
}

export const authenticate = (req: AuthRequest, _res: Response, next: NextFunction) => {
    const token = extractAccessToken(req);
    if (!token) {
        throw new AppError("Thiếu token xác thực", 401);
    }

    req.user = verifyAccessToken(token);
    next();
};
