import { Request } from "express";
import { UserRole } from "../entity/User";

export type AuthUser = {
    id: string;
    email: string;
    role: UserRole;
};

export type AuthRequest = Request & {
    user?: AuthUser;
    cookies: Record<string, string | undefined>;
};
