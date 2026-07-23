import { api } from "./client";
import type { ApiSuccess, DiningRoom } from "../types/api";

export async function fetchRooms() {
    const { data } = await api.get<ApiSuccess<DiningRoom[]>>("/api/rooms");
    return data.data;
}
