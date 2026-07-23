import { api } from "./client";
import type { ApiSuccess, DiningTable } from "../types/api";

export type TableInput = {
    name: string;
    material: string;
    shape: string;
    dimensions?: string;
    quantity?: number;
    diningRoomId: string;
};

export async function fetchTables() {
    const { data } = await api.get<ApiSuccess<DiningTable[]>>("/api/tables");
    return data.data;
}

export async function createTable(body: TableInput) {
    const { data } = await api.post<ApiSuccess<DiningTable>>("/api/tables", body);
    return data.data;
}

export async function updateTable(id: string, body: Partial<TableInput>) {
    const { data } = await api.put<ApiSuccess<DiningTable>>(`/api/tables/${id}`, body);
    return data.data;
}

export async function deleteTable(id: string) {
    await api.delete(`/api/tables/${id}`);
}
