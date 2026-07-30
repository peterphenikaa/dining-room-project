import { Request } from "express";

export type UserRole = "admin" | "user";

export type AuthUser = {
    id: string;
    email: string;
    role: UserRole;
};

export type AuthRequest = Request & {
    user?: AuthUser;
    cookies: Record<string, string | undefined>;
};
