import { MigrationInterface, QueryRunner } from "typeorm";

export class AddAuthIdentityProfileFields1784292000000 implements MigrationInterface {
    name = "AddAuthIdentityProfileFields1784292000000";

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE \`auth_identities\`
            ADD \`displayName\` varchar(255) NULL,
            ADD \`avatarUrl\` varchar(500) NULL
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE \`auth_identities\`
            DROP COLUMN \`displayName\`,
            DROP COLUMN \`avatarUrl\`
        `);
    }
}
