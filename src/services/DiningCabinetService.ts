import { AppDataSource } from "../data-source";
import { DiningCabinet } from "../entity/DiningCabinet";
import { DiningRoom } from "../entity/DiningRoom";
import type { CursorPaginationQuery } from "../schemas/paginationSchemas";
import { EntityImageService } from "./EntityImageService";
import { AppError } from "../utils/AppError";
import { paginateByCursor } from "../utils/cursorPagination";

const cabinetRepository = AppDataSource.getRepository(DiningCabinet);
const roomRepository = AppDataSource.getRepository(DiningRoom);

export class DiningCabinetService {
    static async create(data: {
        name: string;
        material: string;
        dimensions?: string;
        quantity: number;
        diningRoomId: string;
    }) {
        const room = await roomRepository.findOneBy({ id: data.diningRoomId });
        if (!room) throw new AppError("Không tìm thấy phòng ăn", 404);

        const newCabinet = cabinetRepository.create({
            name: data.name,
            material: data.material,
            dimensions: data.dimensions,
            quantity: data.quantity,
            diningRoom: room,
        });

        return await cabinetRepository.save(newCabinet);
    }

    static async getAll(query: CursorPaginationQuery) {
        return paginateByCursor(cabinetRepository, {
            ...query,
            alias: "cabinet",
            relations: ["diningRoom"],
        });
    }

    static async getById(id: string) {
        return await cabinetRepository.findOne({
            where: { id },
            relations: ["diningRoom"],
        });
    }

    static async update(
        id: string,
        data: {
            name?: string;
            material?: string;
            dimensions?: string;
            quantity?: number;
            diningRoomId?: string;
        }
    ) {
        const cabinet = await this.getById(id);
        if (!cabinet) return null;

        if (data.diningRoomId) {
            const room = await roomRepository.findOneBy({ id: data.diningRoomId });
            if (!room) throw new AppError("Không tìm thấy phòng ăn", 404);
            cabinet.diningRoom = room;
        }

        const { diningRoomId, ...fields } = data;
        cabinetRepository.merge(cabinet, fields);
        return await cabinetRepository.save(cabinet);
    }

    static async delete(id: string) {
        const cabinet = await cabinetRepository.findOneBy({ id });
        if (!cabinet) return false;
        await EntityImageService.cleanupKeys(cabinet);
        const result = await cabinetRepository.delete(id);
        return result.affected !== 0;
    }
}
