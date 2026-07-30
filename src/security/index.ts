/**
 * JWT bridge dùng chung Auth + Dining (Phase 3).
 * Dining CHỈ được import từ đây — không import src/modules/auth.
 */
export type { AuthRequest, AuthUser, UserRole } from "./types";
export { authenticate, authorize } from "./middleware";
export {
    ACCESS_COOKIE,
    REFRESH_COOKIE,
    clearAuthCookies,
    setAuthCookies,
} from "./authCookie";
export {
    signAccessToken,
    signRefreshToken,
    verifyAccessToken,
    verifyRefreshToken,
} from "./jwt";
