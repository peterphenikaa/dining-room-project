import { AppError } from "./AppError";

/**
 * Parse & validate quantity từ body.
 * - Không gửi / null / "" → dùng fallback (mặc định 1)
 * - Phải là số nguyên >= 1
 */
export function parseQuantity(value: unknown, fallback = 1): number {
    if (value === undefined || value === null || value === "") {
        return fallback;
    }

    const n = typeof value === "number" ? value : Number(value);
    if (!Number.isFinite(n) || !Number.isInteger(n) || n < 1) {
        throw new AppError("quantity phải là số nguyên >= 1", 400);
    }

    return n;
}

/** Khi update: chỉ validate nếu client có gửi quantity */
export function parseOptionalQuantity(value: unknown): number | undefined {
    if (value === undefined) return undefined;
    return parseQuantity(value);
}
