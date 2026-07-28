import { randomUUID } from "crypto";
import { enqueueProcessImage } from "../queues/processImageQueue";
import type { DiningEntityType } from "../realtime/io";
import { deleteObjects, putObject } from "../storage/s3";
import { AppError } from "../utils/AppError";
import { imageRepoFor } from "../utils/imageEntityRepo";

function extFromMime(mime: string): string {
    if (mime === "image/png") return "png";
    if (mime === "image/webp") return "webp";
    if (mime === "image/gif") return "gif";
    return "jpg";
}

export class EntityImageService {
    static async upload(
        entityType: DiningEntityType,
        entityId: string,
        file: Express.Multer.File
    ) {
        const repo = imageRepoFor(entityType);
        const entity = await repo.findOneBy({ id: entityId });
        if (!entity) {
            throw new AppError("Không tìm thấy bản ghi", 404);
        }

        const ext = extFromMime(file.mimetype);
        const key = `${entityType}/${entityId}/${randomUUID()}.${ext}`;

        const oldKeys = [entity.imageKey, entity.imageThumbKey];

        const url = await putObject({
            key,
            body: file.buffer,
            contentType: file.mimetype,
        });

        entity.imageKey = key;
        entity.imageUrl = url;
        entity.imageThumbKey = null;
        entity.imageThumbUrl = null;
        const saved = await repo.save(entity);

        await deleteObjects(oldKeys);
        await enqueueProcessImage({
            entityType,
            entityId,
            originalKey: key,
        });

        return saved;
    }

    static async remove(entityType: DiningEntityType, entityId: string) {
        const repo = imageRepoFor(entityType);
        const entity = await repo.findOneBy({ id: entityId });
        if (!entity) {
            throw new AppError("Không tìm thấy bản ghi", 404);
        }

        await deleteObjects([entity.imageKey, entity.imageThumbKey]);
        entity.imageKey = null;
        entity.imageUrl = null;
        entity.imageThumbKey = null;
        entity.imageThumbUrl = null;
        return repo.save(entity);
    }

    static async cleanupKeys(entity: {
        imageKey?: string | null;
        imageThumbKey?: string | null;
    } | null) {
        if (!entity) return;
        await deleteObjects([entity.imageKey, entity.imageThumbKey]);
    }
}
