import Redis from "ioredis";
import { redisConfig } from "../config/env";

export type GoogleOAuthPending = {
    codeVerifier: string;
    createdAt: number;
    /** Có mặt = đang liên kết Google vào user đã login */
    linkUserId?: string;
};

const KEY_PREFIX = "oauth:google:";
const TTL_SECONDS = 10 * 60;

let redis: Redis | null = null;

function getRedis(): Redis {
    if (!redis) {
        redis = new Redis({
            host: redisConfig.host,
            port: redisConfig.port,
            maxRetriesPerRequest: null,
        });
    }
    return redis;
}

export async function saveGoogleOAuthPending(
    state: string,
    data: GoogleOAuthPending,
): Promise<void> {
    await getRedis().set(
        `${KEY_PREFIX}${state}`,
        JSON.stringify(data),
        "EX",
        TTL_SECONDS,
    );
}

export async function takeGoogleOAuthPending(
    state: string,
): Promise<GoogleOAuthPending | null> {
    const key = `${KEY_PREFIX}${state}`;
    const raw = await getRedis().get(key);
    if (!raw) return null;
    await getRedis().del(key);
    return JSON.parse(raw) as GoogleOAuthPending;
}
