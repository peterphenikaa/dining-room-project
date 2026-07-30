import { NextFunction, Response } from "express";
import { AppError } from "../utils/AppError";
import { ACCESS_COOKIE } from "./authCookie";
import { verifyAccessToken } from "./jwt";
import type { AuthRequest, UserRole } from "./types";

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

export const authorize =
    (...allowedRoles: UserRole[]) =>
    (req: AuthRequest, _res: Response, next: NextFunction) => {
        if (!req.user) {
            throw new AppError("Chưa xác thực", 401);
        }

        if (!allowedRoles.includes(req.user.role)) {
            throw new AppError("Không có quyền thực hiện thao tác này", 403);
        }

        next();
    };
