import { z } from "zod";

export const cursorPaginationQuerySchema = z.object({
    cursor: z.preprocess(
        (v) => (v === "" || v === null || v === undefined ? undefined : v),
        z.string().uuid("cursor phải là UUID hợp lệ").optional()
    ),
    limit: z.coerce.number().int().min(1).max(100).default(10),
});

export type CursorPaginationQuery = z.infer<typeof cursorPaginationQuerySchema>;

export type CursorPage<T> = {
    items: T[];
    nextCursor: string | null;
    hasMore: boolean;
};
