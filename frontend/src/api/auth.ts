import { api } from "./client";
import type { ApiSuccess, AuthUser, UserProfile } from "../types/api";
import { resolveApiUrl } from "../utils/apiUrl";

export async function login(email: string, password: string) {
    const { data } = await api.post<ApiSuccess<{ user: AuthUser }>>("/api/auth/login", {
        email,
        password,
    });
    return data.data.user;
}

export async function register(email: string, password: string, confirmPassword: string) {
    const { data } = await api.post<ApiSuccess<{ user: AuthUser }>>("/api/auth/register", {
        email,
        password,
        confirmPassword,
    });
    return data.data.user;
}

export async function logout() {
    await api.post("/api/auth/logout");
}

export async function getMe() {
    const { data } = await api.get<ApiSuccess<AuthUser>>("/api/auth/me");
    return data.data;
}

export async function refresh() {
    const { data } = await api.post<ApiSuccess<{ user: AuthUser }>>("/api/auth/refresh");
    return data.data.user;
}

export function getGoogleLoginUrl(): string {
    return `${resolveApiUrl()}/api/auth/google`;
}

export function getGoogleLinkUrl(): string {
    return `${resolveApiUrl()}/api/auth/google/link`;
}

export async function unlinkGoogle() {
    const { data } = await api.delete<ApiSuccess<UserProfile>>("/api/auth/profile/google");
    return data.data;
}
