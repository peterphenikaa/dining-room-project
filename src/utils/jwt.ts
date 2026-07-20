import jwt from "jsonwebtoken";
import { AuthUser } from "../types/auth";
import { AppError } from "../utils/AppError";

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-me";
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || `${JWT_SECRET}-refresh`;
const JWT_ACCESS_EXPIRES_IN = process.env.JWT_ACCESS_EXPIRES_IN || "15m";
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || "7d";

type AccessPayload = AuthUser & { type: "access" };
type RefreshPayload = { id: string; type: "refresh" };

export function signAccessToken(user: AuthUser): string {
    const payload: AccessPayload = {
        id: user.id,
        email: user.email,
        role: user.role,
        type: "access",
    };
    return jwt.sign(payload, JWT_SECRET, {
        expiresIn: JWT_ACCESS_EXPIRES_IN as jwt.SignOptions["expiresIn"],
    });
}

export function signRefreshToken(user: AuthUser): string {
    const payload: RefreshPayload = { id: user.id, type: "refresh" };
    return jwt.sign(payload, JWT_REFRESH_SECRET, {
        expiresIn: JWT_REFRESH_EXPIRES_IN as jwt.SignOptions["expiresIn"],
    });
}

export function verifyAccessToken(token: string): AuthUser {
    try {
        const payload = jwt.verify(token, JWT_SECRET) as AccessPayload;
        if (payload.type !== "access") {
            throw new Error("invalid token type");
        }
        return { id: payload.id, email: payload.email, role: payload.role };
    } catch {
        throw new AppError("Access token không hợp lệ hoặc đã hết hạn", 401);
    }
}

export function verifyRefreshToken(token: string): { id: string } {
    try {
        const payload = jwt.verify(token, JWT_REFRESH_SECRET) as RefreshPayload;
        if (payload.type !== "refresh") {
            throw new Error("invalid token type");
        }
        return { id: payload.id };
    } catch {
        throw new AppError("Refresh token không hợp lệ hoặc đã hết hạn", 401);
    }
}
