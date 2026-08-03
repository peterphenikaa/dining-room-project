import { AppDataSource } from "../data-source";
import { DiningTable } from "../entity/DiningTable";
import { DiningRoom } from "../entity/DiningRoom";
import type { CursorPaginationQuery } from "../schemas/paginationSchemas";
import { EntityImageService } from "./EntityImageService";
import { AppError } from "../utils/AppError";
import { paginateByCursor } from "../utils/cursorPagination";

const roomRepository = AppDataSource.getRepository(DiningRoom);
const tableRepository = AppDataSource.getRepository(DiningTable);

export class DiningTableService {
    static async create(data: {
        name: string;
        material: string;
        shape: string;
        dimensions?: string;
        quantity: number;
        price: number;
        diningRoomId: string;
    }) {
        const room = await roomRepository.findOneBy({ id: data.diningRoomId });
        if (!room) throw new AppError("Không tìm thấy phòng ăn", 404);

        const newTable = tableRepository.create({
            name: data.name,
            material: data.material,
            shape: data.shape,
            dimensions: data.dimensions,
            quantity: data.quantity,
            price: data.price,
            diningRoom: room,
        });

        return await tableRepository.save(newTable);
    }

    static async getAll(query: CursorPaginationQuery) {
        return paginateByCursor(tableRepository, {
            ...query,
            alias: "table",
            relations: ["diningRoom"],
        });
    }

    static async getById(id: string) {
        return await tableRepository.findOne({
            where: { id },
            relations: ["diningRoom", "chairs", "accessories"],
        });
    }

    static async update(
        id: string,
        data: {
            name?: string;
            material?: string;
            shape?: string;
            dimensions?: string;
            quantity?: number;
            price?: number;
            diningRoomId?: string;
        }
    ) {
        const table = await tableRepository.findOne({
            where: { id },
            relations: ["diningRoom"],
        });
        if (!table) return null;

        if (data.diningRoomId) {
            const room = await roomRepository.findOneBy({ id: data.diningRoomId });
            if (!room) throw new AppError("Không tìm thấy phòng ăn", 404);
            table.diningRoom = room;
        }

        const { diningRoomId, ...fields } = data;
        tableRepository.merge(table, fields);
        return await tableRepository.save(table);
    }

    static async delete(id: string) {
        const table = await tableRepository.findOneBy({ id });
        if (!table) return false;
        await EntityImageService.cleanupKeys(table);
        const result = await tableRepository.delete(id);
        return result.affected !== 0;
    }
}
