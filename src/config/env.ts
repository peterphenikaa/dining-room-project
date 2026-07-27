/**
 * Đọc config từ process.env — production chỉ sửa .env, không hardcode port/host trong code.
 * Fallback chỉ dùng khi thiếu env (local/dev).
 */

function env(name: string, fallback?: string): string {
    const v = process.env[name];
    if (v !== undefined && v !== "") return v;
    if (fallback !== undefined) return fallback;
    throw new Error(`Thiếu biến môi trường bắt buộc: ${name}`);
}

function envInt(name: string, fallback: number): number {
    const raw = process.env[name];
    if (raw === undefined || raw === "") return fallback;
    const n = parseInt(raw, 10);
    if (Number.isNaN(n)) throw new Error(`${name} phải là số, nhận được: ${raw}`);
    return n;
}

function envBool(name: string, fallback = false): boolean {
    const raw = process.env[name];
    if (raw === undefined || raw === "") return fallback;
    return ["1", "true", "yes", "on"].includes(raw.toLowerCase());
}

export const appConfig = {
    port: envInt("PORT", 3002),
    corsOrigin: process.env.CORS_ORIGIN || "",
    nodeEnv: process.env.NODE_ENV || "development",
};

export const dbConfig = {
    host: env("DB_HOST", "localhost"),
    port: envInt("DB_PORT", 3306),
    user: env("DB_USER", "dbuser"),
    password: env("DB_PASS", "dbpassword"),
    name: env("DB_NAME", "phongan_db"),
};

export const redisConfig = {
    host: env("REDIS_HOST", "localhost"),
    port: envInt("REDIS_PORT", 6379),
};

/** Endpoint nội bộ (app/worker → MinIO trong Docker: minio:9000). */
export const minioConfig = {
    endpointHost: env("MINIO_ENDPOINT", "localhost"),
    endpointPort: envInt("MINIO_PORT", 9000),
    useSsl: envBool("MINIO_USE_SSL", false),
    accessKey: env("MINIO_ACCESS_KEY", "minioadmin"),
    secretKey: env("MINIO_SECRET_KEY", "minioadmin"),
    bucket: env("MINIO_BUCKET", "dining-images"),
    region: env("MINIO_REGION", "us-east-1"),
    /** Host/port mà browser gọi (thường localhost khi map port ra máy). */
    publicHost: env("MINIO_PUBLIC_HOST", "localhost"),
    publicPort: envInt("MINIO_PUBLIC_PORT", envInt("MINIO_PORT", 9000)),
    publicUseSsl: envBool("MINIO_PUBLIC_USE_SSL", envBool("MINIO_USE_SSL", false)),
    /** Nếu set đầy đủ thì ưu tiên hơn publicHost/port (CDN / reverse proxy). */
    publicUrlOverride: process.env.MINIO_PUBLIC_URL?.replace(/\/$/, "") || "",
};

export function minioInternalEndpoint(): string {
    const scheme = minioConfig.useSsl ? "https" : "http";
    return `${scheme}://${minioConfig.endpointHost}:${minioConfig.endpointPort}`;
}

/** Base URL FE/browser dùng để GET object (public read). */
export function minioPublicBaseUrl(): string {
    if (minioConfig.publicUrlOverride) return minioConfig.publicUrlOverride;
    const scheme = minioConfig.publicUseSsl ? "https" : "http";
    const port = minioConfig.publicPort;
    const omitPort =
        (scheme === "http" && port === 80) || (scheme === "https" && port === 443);
    return omitPort
        ? `${scheme}://${minioConfig.publicHost}`
        : `${scheme}://${minioConfig.publicHost}:${port}`;
}
