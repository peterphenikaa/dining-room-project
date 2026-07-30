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

/** Dining → Auth (Docker service name hoặc localhost) */
export const authServiceConfig = {
    url: (process.env.AUTH_SERVICE_URL || "http://localhost:3003").replace(/\/$/, ""),
    /** Proxy timeout (ms) */
    proxyTimeoutMs: envInt("AUTH_PROXY_TIMEOUT_MS", 10_000),
    /** Health check Auth timeout (ms) */
    healthTimeoutMs: envInt("AUTH_HEALTH_TIMEOUT_MS", 2_000),
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

export const minioConfig = {
    endpointHost: env("MINIO_ENDPOINT", "localhost"),
    endpointPort: envInt("MINIO_PORT", 9000),
    useSsl: envBool("MINIO_USE_SSL", false),
    accessKey: env("MINIO_ACCESS_KEY", "minioadmin"),
    secretKey: env("MINIO_SECRET_KEY", "minioadmin"),
    bucket: env("MINIO_BUCKET", "dining-images"),
    region: env("MINIO_REGION", "us-east-1"),
    publicHost: env("MINIO_PUBLIC_HOST", "localhost"),
    publicPort: envInt("MINIO_PUBLIC_PORT", envInt("MINIO_PORT", 9000)),
    publicUseSsl: envBool("MINIO_PUBLIC_USE_SSL", envBool("MINIO_USE_SSL", false)),
    publicUrlOverride: process.env.MINIO_PUBLIC_URL?.replace(/\/$/, "") || "",
};

export const googleConfig = {
    clientId: process.env.GOOGLE_CLIENT_ID || "",
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    redirectUri: process.env.GOOGLE_REDIRECT_URI || "",
    oauthScopes: process.env.GOOGLE_OAUTH_SCOPES || "openid email profile",
    successRedirect: process.env.GOOGLE_SUCCESS_REDIRECT || "http://localhost:5173/",
    failureRedirect: process.env.GOOGLE_FAILURE_REDIRECT || "http://localhost:5173/login",
    linkSuccessRedirect:
        process.env.GOOGLE_LINK_SUCCESS_REDIRECT || "http://localhost:5173/profile",
    linkFailureRedirect:
        process.env.GOOGLE_LINK_FAILURE_REDIRECT || "http://localhost:5173/profile",
};

export function assertGoogleOAuthConfigured(): void {
    if (!googleConfig.clientId) throw new Error("Thiếu GOOGLE_CLIENT_ID");
    if (!googleConfig.clientSecret) throw new Error("Thiếu GOOGLE_CLIENT_SECRET");
    if (!googleConfig.redirectUri) throw new Error("Thiếu GOOGLE_REDIRECT_URI");
}

export function minioInternalEndpoint(): string {
    const scheme = minioConfig.useSsl ? "https" : "http";
    return `${scheme}://${minioConfig.endpointHost}:${minioConfig.endpointPort}`;
}

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

export function googleOauthScopes(): string[] {
    return googleConfig.oauthScopes
        .split(/\s+/)
        .map((s) => s.trim())
        .filter(Boolean);
}
