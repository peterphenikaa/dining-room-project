import { NextFunction, Response } from "express";
import { UserRole } from "../entity/User";
import { AuthRequest } from "../types/auth";
import { AppError } from "../utils/AppError";

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
