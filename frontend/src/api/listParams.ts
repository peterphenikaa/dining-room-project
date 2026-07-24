import type { ListQuery } from "../types/api";

export function toListParams(query?: ListQuery): Record<string, string> {
    const params: Record<string, string> = {};
    if (query?.cursor) params.cursor = query.cursor;
    if (query?.limit != null) params.limit = String(query.limit);
    return params;
}

export const PAGE_LIMIT = 5;

export const OPTIONS_LIMIT = 100;
