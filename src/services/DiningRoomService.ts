import { AppDataSource } from "../data-source";
import { DiningRoom } from "../entity/DiningRoom";
import type { CursorPaginationQuery } from "../schemas/paginationSchemas";
import { EntityImageService } from "./EntityImageService";
import { paginateByCursor } from "../utils/cursorPagination";

const roomRepository = AppDataSource.getRepository(DiningRoom);

export class DiningRoomService {
    static async create(data: { name: string; area_size: number; style?: string }) {
        const newRoom = roomRepository.create(data);
        return await roomRepository.save(newRoom);
    }

    static async getAll(query: CursorPaginationQuery) {
        return paginateByCursor(roomRepository, { ...query, alias: "room" });
    }

    static async getById(id: string) {
        return await roomRepository.findOneBy({ id });
    }

    static async update(id: string, data: { name?: string; area_size?: number; style?: string }) {
        const room = await this.getById(id);
        if (!room) return null;

        roomRepository.merge(room, data);
        return await roomRepository.save(room);
    }

    static async delete(id: string) {
        const room = await this.getById(id);
        if (!room) return false;
        await EntityImageService.cleanupKeys(room);
        const result = await roomRepository.delete(id);
        return result.affected !== 0;
    }
}
