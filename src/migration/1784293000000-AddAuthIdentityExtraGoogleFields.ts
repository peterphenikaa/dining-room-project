import { MigrationInterface, QueryRunner } from "typeorm";

export class AddAuthIdentityExtraGoogleFields1784293000000 implements MigrationInterface {
    name = "AddAuthIdentityExtraGoogleFields1784293000000";

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE \`auth_identities\`
            ADD \`givenName\` varchar(255) NULL,
            ADD \`familyName\` varchar(255) NULL,
            ADD \`locale\` varchar(32) NULL
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE \`auth_identities\`
            DROP COLUMN \`givenName\`,
            DROP COLUMN \`familyName\`,
            DROP COLUMN \`locale\`
        `);
    }
}
