import { api } from "./client";
import type { ApiSuccess } from "../types/api";

export type EntityImagePaths =
    | "rooms"
    | "tables"
    | "cabinets"
    | "chairs"
    | "accessories";

export async function uploadEntityImage<T>(path: EntityImagePaths, id: string, file: File) {
    const form = new FormData();
    form.append("image", file);
    const { data } = await api.post<ApiSuccess<T>>(`/api/${path}/${id}/image`, form);
    return data.data;
}

export async function deleteEntityImage<T>(path: EntityImagePaths, id: string) {
    const { data } = await api.delete<ApiSuccess<T>>(`/api/${path}/${id}/image`);
    return data.data;
}
