import { ConnectionOptions } from "bullmq";
import { redisConfig } from "../config/env";

/** Kết nối Redis dùng chung cho Queue + Worker (BullMQ / ioredis). */
export function getRedisConnection(): ConnectionOptions {
    return {
        host: redisConfig.host,
        port: redisConfig.port,
        maxRetriesPerRequest: null,
    };
}

export const DEFAULT_JOB_OPTS = {
    attempts: 3,
    backoff: {
        type: "exponential" as const,
        delay: 2000,
    },
    removeOnComplete: 100,
    removeOnFail: 200,
};
