import { api } from "./client";
import type { ApiSuccess, UserProfile, UserRole } from "../types/api";

export async function fetchMyProfile() {
    const { data } = await api.get<ApiSuccess<UserProfile>>("/api/auth/profile");
    return data.data;
}

export async function updateMyProfile(body: {
    email?: string;
    currentPassword?: string;
    newPassword?: string;
}) {
    const { data } = await api.put<ApiSuccess<UserProfile>>("/api/auth/profile", body);
    return data.data;
}

export async function fetchUsers() {
    const { data } = await api.get<ApiSuccess<UserProfile[]>>("/api/users");
    return data.data;
}

export async function updateUser(
    id: string,
    body: { email?: string; role?: UserRole; newPassword?: string },
) {
    const { data } = await api.put<ApiSuccess<UserProfile>>(`/api/users/${id}`, body);
    return data.data;
}

export async function deleteUser(id: string) {
    await api.delete(`/api/users/${id}`);
}
