import { api } from "./client";
import type { ApiSuccess, DiningRoom } from "../types/api";

export type RoomInput = {
    name: string;
    area_size: number;
    style?: string;
};

export async function fetchRooms() {
    const { data } = await api.get<ApiSuccess<DiningRoom[]>>("/api/rooms");
    return data.data;
}

export async function createRoom(body: RoomInput) {
    const { data } = await api.post<ApiSuccess<DiningRoom>>("/api/rooms", body);
    return data.data;
}

export async function updateRoom(id: string, body: Partial<RoomInput>) {
    const { data } = await api.put<ApiSuccess<DiningRoom>>(`/api/rooms/${id}`, body);
    return data.data;
}

export async function deleteRoom(id: string) {
    await api.delete(`/api/rooms/${id}`);
}
