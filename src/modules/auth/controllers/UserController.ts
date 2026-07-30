import { Response } from "express";
import { AppError } from "../../../utils/AppError";
import { SuccessResponse } from "../../../utils/SuccessResponse";
import { adminUpdateUserSchema } from "../schemas/userSchemas";
import { UserService } from "../services/UserService";
import type { AuthRequest } from "../types";

export const listUsers = async (_req: AuthRequest, res: Response) => {
    const users = await UserService.listProfiles();
    return SuccessResponse(res, 200, "Danh sách người dùng", users);
};

export const getUserById = async (req: AuthRequest, res: Response) => {
    const id = String(req.params.id);
    const profile = await UserService.getProfile(id);
    return SuccessResponse(res, 200, "Chi tiết người dùng", profile);
};

export const updateUser = async (req: AuthRequest, res: Response) => {
    if (!req.user) throw new AppError("Chưa xác thực", 401);
    const id = String(req.params.id);
    const input = adminUpdateUserSchema.parse(req.body);
    const profile = await UserService.adminUpdate(req.user.id, id, input);
    return SuccessResponse(res, 200, "Cập nhật người dùng thành công", profile);
};

export const deleteUser = async (req: AuthRequest, res: Response) => {
    if (!req.user) throw new AppError("Chưa xác thực", 401);
    const id = String(req.params.id);
    await UserService.adminDelete(req.user.id, id);
    return SuccessResponse(res, 200, "Đã xóa người dùng", null);
};
