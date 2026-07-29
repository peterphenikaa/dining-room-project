import { MigrationInterface, QueryRunner } from "typeorm";

export class AddImageColumns1784280000000 implements MigrationInterface {
    name = "AddImageColumns1784280000000";

    private tables = [
        "dining_room",
        "dining_table",
        "dining_cabinet",
        "dining_chair",
        "dining_accessory",
    ];

    public async up(queryRunner: QueryRunner): Promise<void> {
        for (const table of this.tables) {
            await queryRunner.query(`ALTER TABLE \`${table}\` ADD \`imageUrl\` varchar(500) NULL`);
            await queryRunner.query(`ALTER TABLE \`${table}\` ADD \`imageKey\` varchar(500) NULL`);
            await queryRunner.query(
                `ALTER TABLE \`${table}\` ADD \`imageThumbUrl\` varchar(500) NULL`
            );
            await queryRunner.query(
                `ALTER TABLE \`${table}\` ADD \`imageThumbKey\` varchar(500) NULL`
            );
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        for (const table of this.tables) {
            await queryRunner.query(`ALTER TABLE \`${table}\` DROP COLUMN \`imageThumbKey\``);
            await queryRunner.query(`ALTER TABLE \`${table}\` DROP COLUMN \`imageThumbUrl\``);
            await queryRunner.query(`ALTER TABLE \`${table}\` DROP COLUMN \`imageKey\``);
            await queryRunner.query(`ALTER TABLE \`${table}\` DROP COLUMN \`imageUrl\``);
        }
    }
}
