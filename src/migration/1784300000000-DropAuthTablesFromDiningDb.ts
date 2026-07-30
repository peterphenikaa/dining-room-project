import { MigrationInterface, QueryRunner } from "typeorm";

/** Gỡ bảng Auth khỏi dining DB sau khi đã chuyển sang phongan_auth */
export class DropAuthTablesFromDiningDb1784300000000 implements MigrationInterface {
    name = "DropAuthTablesFromDiningDb1784300000000";

    public async up(queryRunner: QueryRunner): Promise<void> {
        const authIdentities = await queryRunner.query(`SHOW TABLES LIKE 'auth_identities'`);
        if (authIdentities.length > 0) {
            await queryRunner.query(`DROP TABLE \`auth_identities\``);
        }
        const users = await queryRunner.query(`SHOW TABLES LIKE 'users'`);
        if (users.length > 0) {
            await queryRunner.query(`DROP TABLE \`users\``);
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Không recreate — Auth sống ở DB riêng. Rollback = restore backup.
        void queryRunner;
    }
}
