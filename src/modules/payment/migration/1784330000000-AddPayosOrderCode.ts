import { MigrationInterface, QueryRunner } from "typeorm"

export class AddPayosOrderCode1784330000000 implements MigrationInterface {
    name = "AddPayosOrderCode1784330000000"

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE \`payments\` ADD \`orderCode\` bigint NULL`,
        )
        await queryRunner.query(
            `CREATE UNIQUE INDEX \`IDX_payments_orderCode\` ON \`payments\` (\`orderCode\`)`,
        )
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `DROP INDEX \`IDX_payments_orderCode\` ON \`payments\``,
        )
        await queryRunner.query(
            `ALTER TABLE \`payments\` DROP COLUMN \`orderCode\``,
        )
    }
}
