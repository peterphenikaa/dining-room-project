import { AppDataSource } from "../data-source";
import { DiningChair } from "../entity/DiningChair";
import { DiningTable } from "../entity/DiningTable";
import { AppError } from "../utils/AppError";

const chairRepository = AppDataSource.getRepository(DiningChair);
const tableRepository = AppDataSource.getRepository(DiningTable);

export class DiningChairService {
    static async create(data: {
        name: string;
        material: string;
        color?: string;
        quantity: number;
        diningTableId: string;
    }) {
        const table = await tableRepository.findOneBy({ id: data.diningTableId });
        if (!table) throw new AppError("Không tìm thấy bàn ăn", 404);

        const newChair = chairRepository.create({
            name: data.name,
            material: data.material,
            color: data.color,
            quantity: data.quantity,
            diningTable: table,
        });

        return await chairRepository.save(newChair);
    }

    static async getAll() {
        return await chairRepository.find({ relations: ["diningTable"] });
    }

    static async getById(id: string) {
        return await chairRepository.findOne({
            where: { id },
            relations: ["diningTable"],
        });
    }

    static async update(
        id: string,
        data: {
            name?: string;
            material?: string;
            color?: string;
            quantity?: number;
            diningTableId?: string;
        }
    ) {
        const chair = await this.getById(id);
        if (!chair) return null;

        if (data.diningTableId) {
            const table = await tableRepository.findOneBy({ id: data.diningTableId });
            if (!table) throw new AppError("Không tìm thấy bàn ăn", 404);
            chair.diningTable = table;
        }

        const { diningTableId, ...fields } = data;
        chairRepository.merge(chair, fields);
        return await chairRepository.save(chair);
    }

    static async delete(id: string) {
        const result = await chairRepository.delete(id);
        return result.affected !== 0;
    }
}
