/**
 * Seed dữ liệu dining demo (có quantity).
 * Giữ file — chạy lại được (idempotent theo name).
 *
 * Docker:
 *   docker exec express_app npx ts-node src/seed/seedDiningData.ts
 *
 * Local (DB_HOST=localhost):
 *   npx ts-node src/seed/seedDiningData.ts
 */
import "dotenv/config";
import "reflect-metadata";
import { AppDataSource } from "../data-source";
import { DiningRoom } from "../entity/DiningRoom";
import { DiningTable } from "../entity/DiningTable";
import { DiningCabinet } from "../entity/DiningCabinet";
import { DiningChair } from "../entity/DiningChair";
import { DiningAccessory } from "../entity/DiningAccessory";

async function upsertRoom() {
    const repo = AppDataSource.getRepository(DiningRoom);
    let room = await repo.findOneBy({ name: "Phòng ăn Demo Quantity" });
    if (!room) {
        room = repo.create({
            name: "Phòng ăn Demo Quantity",
            area_size: 36,
            style: "modern",
        });
        room = await repo.save(room);
        console.log("  + tạo room:", room.id);
    } else {
        console.log("  · reuse room:", room.id);
    }
    return room;
}

async function upsertTable(room: DiningRoom) {
    const repo = AppDataSource.getRepository(DiningTable);
    let table = await repo.findOne({
        where: { name: "Bàn gỗ óc chó", diningRoom: { id: room.id } },
        relations: ["diningRoom"],
    });
    if (!table) {
        table = repo.create({
            name: "Bàn gỗ óc chó",
            material: "gỗ óc chó",
            shape: "chữ nhật",
            dimensions: "180x90x75",
            quantity: 2,
            diningRoom: room,
        });
        table = await repo.save(table);
        console.log("  + tạo table quantity=2:", table.id);
    } else {
        table.quantity = 2;
        table = await repo.save(table);
        console.log("  · cập nhật table quantity=2:", table.id);
    }
    return table;
}

async function upsertCabinet(room: DiningRoom) {
    const repo = AppDataSource.getRepository(DiningCabinet);
    let cabinet = await repo.findOne({
        where: { name: "Tủ chén treo", diningRoom: { id: room.id } },
        relations: ["diningRoom"],
    });
    if (!cabinet) {
        cabinet = repo.create({
            name: "Tủ chén treo",
            material: "MDF",
            dimensions: "120x40x60",
            quantity: 3,
            diningRoom: room,
        });
        cabinet = await repo.save(cabinet);
        console.log("  + tạo cabinet quantity=3:", cabinet.id);
    } else {
        cabinet.quantity = 3;
        cabinet = await repo.save(cabinet);
        console.log("  · cập nhật cabinet quantity=3:", cabinet.id);
    }
    return cabinet;
}

async function upsertChair(table: DiningTable) {
    const repo = AppDataSource.getRepository(DiningChair);
    let chair = await repo.findOne({
        where: { name: "Ghế đệm xám", diningTable: { id: table.id } },
        relations: ["diningTable"],
    });
    if (!chair) {
        chair = repo.create({
            name: "Ghế đệm xám",
            material: "gỗ + vải",
            color: "xám",
            quantity: 6,
            diningTable: table,
        });
        chair = await repo.save(chair);
        console.log("  + tạo chair quantity=6:", chair.id);
    } else {
        chair.quantity = 6;
        chair = await repo.save(chair);
        console.log("  · cập nhật chair quantity=6:", chair.id);
    }
    return chair;
}

async function upsertAccessory(table: DiningTable) {
    const repo = AppDataSource.getRepository(DiningAccessory);
    let accessory = await repo.findOne({
        where: { name: "Bộ thìa đũa", diningTable: { id: table.id } },
        relations: ["diningTable"],
    });
    if (!accessory) {
        accessory = repo.create({
            name: "Bộ thìa đũa",
            type: "dao thìa đũa",
            quantity: 12,
            diningTable: table,
        });
        accessory = await repo.save(accessory);
        console.log("  + tạo accessory quantity=12:", accessory.id);
    } else {
        accessory.quantity = 12;
        accessory = await repo.save(accessory);
        console.log("  · cập nhật accessory quantity=12:", accessory.id);
    }
    return accessory;
}

async function main() {
    console.log("Seed dining data (có quantity)...");
    await AppDataSource.initialize();

    const room = await upsertRoom();
    const table = await upsertTable(room);
    await upsertCabinet(room);
    await upsertChair(table);
    await upsertAccessory(table);

    await AppDataSource.destroy();
    console.log("Seed xong.");
}

main().catch(async (err) => {
    console.error(err);
    if (AppDataSource.isInitialized) await AppDataSource.destroy();
    process.exit(1);
});
