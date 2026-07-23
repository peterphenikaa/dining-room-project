import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Thêm cột quantity (số lượng) cho bàn / tủ / ghế / phụ kiện.
 * DiningRoom không thêm — mỗi phòng là 1 thực thể riêng.
 */
export class AddQuantityColumns1784261000000 implements MigrationInterface {
    name = "AddQuantityColumns1784261000000";

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE \`dining_table\` ADD \`quantity\` int NOT NULL DEFAULT 1`
        );
        await queryRunner.query(
            `ALTER TABLE \`dining_cabinet\` ADD \`quantity\` int NOT NULL DEFAULT 1`
        );
        await queryRunner.query(
            `ALTER TABLE \`dining_chair\` ADD \`quantity\` int NOT NULL DEFAULT 1`
        );
        await queryRunner.query(
            `ALTER TABLE \`dining_accessory\` ADD \`quantity\` int NOT NULL DEFAULT 1`
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`dining_accessory\` DROP COLUMN \`quantity\``);
        await queryRunner.query(`ALTER TABLE \`dining_chair\` DROP COLUMN \`quantity\``);
        await queryRunner.query(`ALTER TABLE \`dining_cabinet\` DROP COLUMN \`quantity\``);
        await queryRunner.query(`ALTER TABLE \`dining_table\` DROP COLUMN \`quantity\``);
    }
}
