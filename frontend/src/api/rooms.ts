import { api } from "./client";
import { toListParams } from "./listParams";
import type { ApiSuccess, CursorPage, DiningRoom, ListQuery } from "../types/api";

export type RoomInput = {
    name: string;
    area_size: number;
    style?: string;
};

export async function fetchRooms(query?: ListQuery) {
    const { data } = await api.get<ApiSuccess<CursorPage<DiningRoom>>>("/api/rooms", {
        params: toListParams(query),
    });
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
