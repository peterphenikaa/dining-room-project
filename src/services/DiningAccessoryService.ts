import { AppDataSource } from "../data-source";
import { DiningAccessory } from "../entity/DiningAccessory";
import { DiningTable } from "../entity/DiningTable";
import type { CursorPaginationQuery } from "../schemas/paginationSchemas";
import { EntityImageService } from "./EntityImageService";
import { AppError } from "../utils/AppError";
import { paginateByCursor } from "../utils/cursorPagination";

const accessoryRepository = AppDataSource.getRepository(DiningAccessory);
const tableRepository = AppDataSource.getRepository(DiningTable);

export class DiningAccessoryService {
    static async create(data: {
        name: string;
        type: string;
        quantity: number;
        price: number;
        diningTableId: string;
    }) {
        const table = await tableRepository.findOneBy({ id: data.diningTableId });
        if (!table) throw new AppError("Không tìm thấy bàn ăn", 404);

        const newAccessory = accessoryRepository.create({
            name: data.name,
            type: data.type,
            quantity: data.quantity,
            price: data.price,
            diningTable: table,
        });

        return await accessoryRepository.save(newAccessory);
    }

    static async getAll(query: CursorPaginationQuery) {
        return paginateByCursor(accessoryRepository, {
            ...query,
            alias: "accessory",
            relations: ["diningTable"],
        });
    }

    static async getById(id: string) {
        return await accessoryRepository.findOne({
            where: { id },
            relations: ["diningTable"],
        });
    }

    static async update(
        id: string,
        data: {
            name?: string;
            type?: string;
            quantity?: number;
            price?: number;
            diningTableId?: string;
        }
    ) {
        const accessory = await this.getById(id);
        if (!accessory) return null;

        if (data.diningTableId) {
            const table = await tableRepository.findOneBy({ id: data.diningTableId });
            if (!table) throw new AppError("Không tìm thấy bàn ăn", 404);
            accessory.diningTable = table;
        }

        const { diningTableId, ...fields } = data;
        accessoryRepository.merge(accessory, fields);
        return await accessoryRepository.save(accessory);
    }

    static async delete(id: string) {
        const accessory = await accessoryRepository.findOneBy({ id });
        if (!accessory) return false;
        await EntityImageService.cleanupKeys(accessory);
        const result = await accessoryRepository.delete(id);
        return result.affected !== 0;
    }
}
