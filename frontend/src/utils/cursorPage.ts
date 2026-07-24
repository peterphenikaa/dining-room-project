import type { Dispatch, SetStateAction } from "react";
import type { CursorPage } from "../types/api";

/** Áp 1 trang cursor: thay items (không nối), nhớ cursor trang kế. */
export function applyCursorPage<T>(
    page: CursorPage<T>,
    index: number,
    setItems: (items: T[]) => void,
    setHasMore: (v: boolean) => void,
    setPageIndex: (i: number) => void,
    setPageCursors: Dispatch<SetStateAction<(string | undefined)[]>>
) {
    setItems(page.items);
    setHasMore(page.hasMore);
    setPageIndex(index);
    setPageCursors((prev) => {
        const next = prev.slice(0, index + 1);
        if (page.nextCursor) {
            next[index + 1] = page.nextCursor;
        }
        return next;
    });
}
