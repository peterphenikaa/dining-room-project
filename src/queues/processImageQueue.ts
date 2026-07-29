import { Queue } from "bullmq";
import type { DiningEntityType } from "../realtime/io";
import { DEFAULT_JOB_OPTS, getRedisConnection } from "./connection";

export const PROCESS_IMAGE_QUEUE = "process-image";

export type ProcessImageJob = {
    entityType: DiningEntityType;
    entityId: string;
    originalKey: string;
};

let queue: Queue<ProcessImageJob> | null = null;

export function getProcessImageQueue() {
    if (!queue) {
        queue = new Queue<ProcessImageJob>(PROCESS_IMAGE_QUEUE, {
            connection: getRedisConnection(),
            defaultJobOptions: DEFAULT_JOB_OPTS,
        });
    }
    return queue;
}

export async function enqueueProcessImage(data: ProcessImageJob) {
    return getProcessImageQueue().add("resize", data, {
        jobId: `img-${data.entityType}-${data.entityId}-${Date.now()}`,
    });
}
