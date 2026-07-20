import { CookieOptions, Response } from "express";

export const ACCESS_COOKIE = "access_token";
export const REFRESH_COOKIE = "refresh_token";

const isProd = process.env.NODE_ENV === "production";

function baseCookieOptions(maxAgeMs: number): CookieOptions {
    return {
        httpOnly: true,
        secure: isProd,
        sameSite: "lax",
        path: "/",
        maxAge: maxAgeMs,
    };
}

const ACCESS_MAX_AGE = 15 * 60 * 1000;
const REFRESH_MAX_AGE = 7 * 24 * 60 * 60 * 1000;

/** @deprecated dùng ACCESS_COOKIE */
export const AUTH_COOKIE = ACCESS_COOKIE;

export function setAccessCookie(res: Response, token: string) {
    res.cookie(ACCESS_COOKIE, token, baseCookieOptions(ACCESS_MAX_AGE));
}

export function setRefreshCookie(res: Response, token: string) {
    res.cookie(REFRESH_COOKIE, token, baseCookieOptions(REFRESH_MAX_AGE));
}

export function setAuthCookies(res: Response, accessToken: string, refreshToken: string) {
    setAccessCookie(res, accessToken);
    setRefreshCookie(res, refreshToken);
}

export function clearAuthCookies(res: Response) {
    const opts = { httpOnly: true, secure: isProd, sameSite: "lax" as const, path: "/" };
    res.clearCookie(ACCESS_COOKIE, opts);
    res.clearCookie(REFRESH_COOKIE, opts);
}

/** @deprecated dùng setAuthCookies */
export function setAuthCookie(res: Response, token: string) {
    setAccessCookie(res, token);
}

/** @deprecated dùng clearAuthCookies */
export function clearAuthCookie(res: Response) {
    clearAuthCookies(res);
}
