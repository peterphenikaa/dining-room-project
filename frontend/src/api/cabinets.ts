import { api } from "./client";
import { toListParams } from "./listParams";
import type { ApiSuccess, CursorPage, DiningCabinet, ListQuery } from "../types/api";

export type CabinetInput = {
    name: string;
    material: string;
    dimensions?: string;
    quantity?: number;
    diningRoomId: string;
};

export async function fetchCabinets(query?: ListQuery) {
    const { data } = await api.get<ApiSuccess<CursorPage<DiningCabinet>>>("/api/cabinets", {
        params: toListParams(query),
    });
    return data.data;
}

export async function createCabinet(body: CabinetInput) {
    const { data } = await api.post<ApiSuccess<DiningCabinet>>("/api/cabinets", body);
    return data.data;
}

export async function updateCabinet(id: string, body: Partial<CabinetInput>) {
    const { data } = await api.put<ApiSuccess<DiningCabinet>>(`/api/cabinets/${id}`, body);
    return data.data;
}

export async function deleteCabinet(id: string) {
    await api.delete(`/api/cabinets/${id}`);
}
