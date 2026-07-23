import { Response } from "express";
import { AuthService } from "../services/AuthService";
import { loginSchema, registerSchema } from "../schemas/authSchemas";
import { AuthRequest } from "../types/auth";
import { AppError } from "../utils/AppError";
import { clearAuthCookies, REFRESH_COOKIE, setAuthCookies } from "../utils/authCookie";
import { SuccessResponse } from "../utils/SuccessResponse";

export const register = async (req: AuthRequest, res: Response) => {
    const { email, password } = registerSchema.parse(req.body);

    const result = await AuthService.register(email, password);
    setAuthCookies(res, result.accessToken, result.refreshToken);
    return SuccessResponse(res, 201, "Đăng ký thành công!", { user: result.user });
};

export const login = async (req: AuthRequest, res: Response) => {
    const { email, password } = loginSchema.parse(req.body);

    const result = await AuthService.login(email, password);
    setAuthCookies(res, result.accessToken, result.refreshToken);
    return SuccessResponse(res, 200, "Đăng nhập thành công!", { user: result.user });
};

export const refresh = async (req: AuthRequest, res: Response) => {
    const refreshToken = req.cookies?.[REFRESH_COOKIE];
    if (!refreshToken) {
        throw new AppError("Thiếu refresh token", 401);
    }

    const result = await AuthService.refresh(refreshToken);
    setAuthCookies(res, result.accessToken, result.refreshToken);
    return SuccessResponse(res, 200, "Làm mới phiên đăng nhập thành công!", { user: result.user });
};

export const me = async (req: AuthRequest, res: Response) => {
    if (!req.user) {
        throw new AppError("Chưa xác thực", 401);
    }

    const user = await AuthService.getMe(req.user.id);
    return SuccessResponse(res, 200, "Lấy thông tin người dùng thành công", user);
};

export const logout = async (_req: AuthRequest, res: Response) => {
    clearAuthCookies(res);
    return SuccessResponse(res, 200, "Đăng xuất thành công!", null);
};
