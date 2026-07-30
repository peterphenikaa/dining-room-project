/**
 * Auth module — chỉ Auth service import (Phase 3).
 * Dining không được import package này.
 */
export { default as authRoutes } from "./routes/authRoutes";
export { default as userRoutes } from "./routes/userRoutes";
export { AuthDataSource } from "./data-source";
export { User } from "./entity/User";
export { AuthIdentity } from "./entity/AuthIdentity";
