import { api } from "./client";
import type { ApiSuccess, DiningAccessory } from "../types/api";

export type AccessoryInput = {
    name: string;
    type: string;
    quantity?: number;
    diningTableId: string;
};

export async function fetchAccessories() {
    const { data } = await api.get<ApiSuccess<DiningAccessory[]>>("/api/accessories");
    return data.data;
}

export async function createAccessory(body: AccessoryInput) {
    const { data } = await api.post<ApiSuccess<DiningAccessory>>("/api/accessories", body);
    return data.data;
}

export async function updateAccessory(id: string, body: Partial<AccessoryInput>) {
    const { data } = await api.put<ApiSuccess<DiningAccessory>>(`/api/accessories/${id}`, body);
    return data.data;
}

export async function deleteAccessory(id: string) {
    await api.delete(`/api/accessories/${id}`);
}
