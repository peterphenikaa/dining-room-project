import { AppDataSource } from "../data-source";
import { DiningRoom } from "../entity/DiningRoom";

const roomRepository = AppDataSource.getRepository(DiningRoom);

export class DiningRoomService {
    static async createRoom(data: { name: string; area_size: number; style?: string }) {
        const newRoom = roomRepository.create(data);
        return await roomRepository.save(newRoom);
    }

    static async getAllRooms() {
        return await roomRepository.find();
    }

    static async getRoomById(id: string) {
        return await roomRepository.findOneBy({ id });
    }

    static async updateRoom(id: string, data: { name?: string; area_size?: number; style?: string }) {
        const room = await this.getRoomById(id);
        if (!room) return null;

        roomRepository.merge(room, data);
        return await roomRepository.save(room);
    }

    static async deleteRoom(id: string) {
        const result = await roomRepository.delete(id);
        return result.affected !== 0;
    }
}
