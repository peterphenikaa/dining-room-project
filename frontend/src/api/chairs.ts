import { api } from "./client";
import type { ApiSuccess, DiningChair } from "../types/api";

export type ChairInput = {
    name: string;
    material: string;
    color?: string;
    quantity?: number;
    diningTableId: string;
};

export async function fetchChairs() {
    const { data } = await api.get<ApiSuccess<DiningChair[]>>("/api/chairs");
    return data.data;
}

export async function createChair(body: ChairInput) {
    const { data } = await api.post<ApiSuccess<DiningChair>>("/api/chairs", body);
    return data.data;
}

export async function updateChair(id: string, body: Partial<ChairInput>) {
    const { data } = await api.put<ApiSuccess<DiningChair>>(`/api/chairs/${id}`, body);
    return data.data;
}

export async function deleteChair(id: string) {
    await api.delete(`/api/chairs/${id}`);
}
