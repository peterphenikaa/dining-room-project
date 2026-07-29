export function parseCorsOrigins(raw?: string): string | string[] {
    const list = (raw || "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
    if (list.length === 0) {
        throw new Error("Thiếu CORS_ORIGIN trong .env (vd: http://localhost:5173,http://localhost:5174)");
    }
    return list.length === 1 ? list[0]! : list;
}
