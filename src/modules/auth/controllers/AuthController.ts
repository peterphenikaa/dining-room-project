import { Response } from "express";
import { googleConfig } from "../../../config/env";
import { AppError } from "../../../utils/AppError";
import { SuccessResponse } from "../../../utils/SuccessResponse";
import { loginSchema, registerSchema } from "../schemas/authSchemas";
import { updateMyProfileSchema } from "../schemas/userSchemas";
import { AuthService } from "../services/AuthService";
import { GoogleAuthService } from "../services/GoogleAuthService";
import { UserService } from "../services/UserService";
import type { AuthRequest } from "../types";
import { clearAuthCookies, REFRESH_COOKIE, setAuthCookies } from "../utils/authCookie";

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

export const getMyProfile = async (req: AuthRequest, res: Response) => {
    if (!req.user) throw new AppError("Chưa xác thực", 401);
    const profile = await UserService.getProfile(req.user.id);
    return SuccessResponse(res, 200, "Lấy hồ sơ thành công", profile);
};

export const updateMyProfile = async (req: AuthRequest, res: Response) => {
    if (!req.user) throw new AppError("Chưa xác thực", 401);
    const input = updateMyProfileSchema.parse(req.body);
    const profile = await UserService.updateMyProfile(req.user.id, input);
    return SuccessResponse(res, 200, "Cập nhật hồ sơ thành công", profile);
};

export const logout = async (_req: AuthRequest, res: Response) => {
    clearAuthCookies(res);
    return SuccessResponse(res, 200, "Đăng xuất thành công!", null);
};

export const startGoogleLogin = async (_req: AuthRequest, res: Response) => {
    const url = await GoogleAuthService.buildAuthorizationUrl();
    return res.redirect(302, url);
};

export const startGoogleLink = async (req: AuthRequest, res: Response) => {
    if (!req.user) throw new AppError("Chưa xác thực", 401);
    const url = await GoogleAuthService.buildAuthorizationUrl({
        linkUserId: req.user.id,
    });
    return res.redirect(302, url);
};

export const unlinkGoogle = async (req: AuthRequest, res: Response) => {
    if (!req.user) throw new AppError("Chưa xác thực", 401);
    await GoogleAuthService.unlinkGoogle(req.user.id);
    const profile = await UserService.getProfile(req.user.id);
    return SuccessResponse(res, 200, "Đã hủy liên kết Google", profile);
};

export const googleCallback = async (req: AuthRequest, res: Response) => {
    const error = typeof req.query.error === "string" ? req.query.error : null;
    if (error) {
        const url = new URL(googleConfig.failureRedirect);
        url.searchParams.set("error", error);
        return res.redirect(302, url.toString());
    }

    const code = typeof req.query.code === "string" ? req.query.code : "";
    const state = typeof req.query.state === "string" ? req.query.state : "";
    if (!code || !state) {
        throw new AppError("Thiếu code hoặc state từ Google", 400);
    }

    try {
        const result = await GoogleAuthService.handleCallback(code, state);
        setAuthCookies(res, result.accessToken, result.refreshToken);
        const redirect =
            result.mode === "link"
                ? googleConfig.linkSuccessRedirect
                : googleConfig.successRedirect;
        return res.redirect(302, redirect);
    } catch (err) {
        const message = err instanceof Error ? err.message : "Google login thất bại";
        const isLinkHint = message.includes("liên kết") || message.includes("Google này");
        const base = isLinkHint
            ? googleConfig.linkFailureRedirect
            : googleConfig.failureRedirect;
        const url = new URL(base);
        url.searchParams.set("error", message);
        return res.redirect(302, url.toString());
    }
};
