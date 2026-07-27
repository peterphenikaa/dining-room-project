import { Worker, Job } from "bullmq";
import sharp from "sharp";
import { Repository } from "typeorm";
import { AppDataSource } from "../data-source";
import { DiningAccessory } from "../entity/DiningAccessory";
import { DiningCabinet } from "../entity/DiningCabinet";
import { DiningChair } from "../entity/DiningChair";
import { DiningRoom } from "../entity/DiningRoom";
import { DiningTable } from "../entity/DiningTable";
import { getRedisConnection } from "../queues/connection";
import { PROCESS_IMAGE_QUEUE, ProcessImageJob } from "../queues/processImageQueue";
import type { DiningEntityType } from "../realtime/io";
import { deleteObject, getObjectBuffer, putObject, publicUrlForKey } from "../storage/s3";

type ImageFields = {
    id: string;
    imageUrl: string | null;
    imageKey: string | null;
    imageThumbUrl: string | null;
    imageThumbKey: string | null;
};

function repoFor(entityType: DiningEntityType): Repository<ImageFields> {
    switch (entityType) {
        case "room":
            return AppDataSource.getRepository(DiningRoom) as Repository<ImageFields>;
        case "table":
            return AppDataSource.getRepository(DiningTable) as Repository<ImageFields>;
        case "cabinet":
            return AppDataSource.getRepository(DiningCabinet) as Repository<ImageFields>;
        case "chair":
            return AppDataSource.getRepository(DiningChair) as Repository<ImageFields>;
        case "accessory":
            return AppDataSource.getRepository(DiningAccessory) as Repository<ImageFields>;
    }
}

async function processImage(job: Job<ProcessImageJob>) {
    const { entityType, entityId, originalKey } = job.data;
    console.log(
        `[process-image] attempt ${job.attemptsMade + 1}/${job.opts.attempts} ${entityType}/${entityId} key=${originalKey}`
    );

    const repo = repoFor(entityType);
    const entity = await repo.findOneBy({ id: entityId });
    if (!entity) {
        console.warn(`[process-image] entity không còn tồn tại, bỏ qua`);
        return;
    }
    if (entity.imageKey !== originalKey) {
        console.warn(`[process-image] originalKey đã đổi, bỏ qua job cũ`);
        return;
    }

    const { body } = await getObjectBuffer(originalKey);
    const thumbBuffer = await sharp(body)
        .rotate()
        .resize(400, 400, { fit: "inside", withoutEnlargement: true })
        .webp({ quality: 80 })
        .toBuffer();

    const thumbKey = originalKey.replace(/(\.[^.]+)?$/, ".thumb.webp");
    const oldThumb = entity.imageThumbKey;

    await putObject({
        key: thumbKey,
        body: thumbBuffer,
        contentType: "image/webp",
    });

    entity.imageThumbKey = thumbKey;
    entity.imageThumbUrl = publicUrlForKey(thumbKey);
    await repo.save(entity);

    if (oldThumb && oldThumb !== thumbKey) {
        await deleteObject(oldThumb);
    }

    console.log(`[process-image] OK thumb=${thumbKey}`);
}

export function startProcessImageWorker() {
    const worker = new Worker<ProcessImageJob>(PROCESS_IMAGE_QUEUE, processImage, {
        connection: getRedisConnection(),
        concurrency: 2,
    });

    worker.on("failed", (job, err) => {
        console.error(`[process-image] FAIL job=${job?.id}:`, err.message);
    });

    worker.on("completed", (job) => {
        console.log(`[process-image] completed job=${job.id}`);
    });

    return worker;
}
