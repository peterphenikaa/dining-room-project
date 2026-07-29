import { MigrationInterface, QueryRunner } from "typeorm";

export class MakeUserPasswordNullable1784291000000 implements MigrationInterface {
    name = "MakeUserPasswordNullable1784291000000";

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE \`users\`
            MODIFY \`passwordHash\` varchar(255) NULL
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            UPDATE \`users\` SET \`passwordHash\` = '' WHERE \`passwordHash\` IS NULL
        `);
        await queryRunner.query(`
            ALTER TABLE \`users\`
            MODIFY \`passwordHash\` varchar(255) NOT NULL
        `);
    }
}
