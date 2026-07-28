import { Worker, Job } from "bullmq";
import sharp from "sharp";
import { getRedisConnection } from "../queues/connection";
import { PROCESS_IMAGE_QUEUE, ProcessImageJob } from "../queues/processImageQueue";
import { deleteObject, getObjectBuffer, putObject, publicUrlForKey } from "../storage/s3";
import { imageRepoFor } from "../utils/imageEntityRepo";

async function processImage(job: Job<ProcessImageJob>) {
    const { entityType, entityId, originalKey } = job.data;
    console.log(
        `[process-image] attempt ${job.attemptsMade + 1}/${job.opts.attempts} ${entityType}/${entityId} key=${originalKey}`
    );

    const repo = imageRepoFor(entityType);
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
