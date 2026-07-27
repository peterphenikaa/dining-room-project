import { randomUUID } from "crypto";
import { Repository } from "typeorm";
import { AppDataSource } from "../data-source";
import { DiningAccessory } from "../entity/DiningAccessory";
import { DiningCabinet } from "../entity/DiningCabinet";
import { DiningChair } from "../entity/DiningChair";
import { DiningRoom } from "../entity/DiningRoom";
import { DiningTable } from "../entity/DiningTable";
import { enqueueProcessImage } from "../queues/processImageQueue";
import type { DiningEntityType } from "../realtime/io";
import { deleteObjects, putObject } from "../storage/s3";
import { AppError } from "../utils/AppError";

type ImageEntity = {
    id: string;
    imageUrl: string | null;
    imageKey: string | null;
    imageThumbUrl: string | null;
    imageThumbKey: string | null;
};

function repoFor(entityType: DiningEntityType): Repository<ImageEntity> {
    switch (entityType) {
        case "room":
            return AppDataSource.getRepository(DiningRoom) as Repository<ImageEntity>;
        case "table":
            return AppDataSource.getRepository(DiningTable) as Repository<ImageEntity>;
        case "cabinet":
            return AppDataSource.getRepository(DiningCabinet) as Repository<ImageEntity>;
        case "chair":
            return AppDataSource.getRepository(DiningChair) as Repository<ImageEntity>;
        case "accessory":
            return AppDataSource.getRepository(DiningAccessory) as Repository<ImageEntity>;
    }
}

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
        const repo = repoFor(entityType);
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
        const repo = repoFor(entityType);
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
