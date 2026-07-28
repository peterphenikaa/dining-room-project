import { Repository } from "typeorm";
import { AppDataSource } from "../data-source";
import { DiningAccessory } from "../entity/DiningAccessory";
import { DiningCabinet } from "../entity/DiningCabinet";
import { DiningChair } from "../entity/DiningChair";
import { DiningRoom } from "../entity/DiningRoom";
import { DiningTable } from "../entity/DiningTable";
import type { DiningEntityType } from "../realtime/io";

export type ImageEntity = {
    id: string;
    imageUrl: string | null;
    imageKey: string | null;
    imageThumbUrl: string | null;
    imageThumbKey: string | null;
};

export function imageRepoFor(entityType: DiningEntityType): Repository<ImageEntity> {
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
