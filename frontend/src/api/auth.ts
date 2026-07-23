import { api } from "./client";
import type { ApiSuccess, AuthUser } from "../types/api";

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
