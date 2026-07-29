import { MigrationInterface, QueryRunner } from "typeorm";

const DEMO_PASSWORD_HASH = "$2b$10$puMrc5m5YOOn.vrmbsOx5.wER4bnp4CfJfJxAFuH6Z8TBv6t1AvjW";

export class CreateUsersTable1784260500000 implements MigrationInterface {
    name = "CreateUsersTable1784260500000";

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE \`users\` (
                \`id\` varchar(36) NOT NULL,
                \`email\` varchar(255) NOT NULL,
                \`passwordHash\` varchar(255) NOT NULL,
                \`role\` varchar(20) NOT NULL DEFAULT 'user',
                UNIQUE INDEX \`IDX_users_email\` (\`email\`),
                PRIMARY KEY (\`id\`)
            ) ENGINE=InnoDB
        `);

        await queryRunner.query(`
            INSERT INTO \`users\` (\`id\`, \`email\`, \`passwordHash\`, \`role\`) VALUES
            (UUID(), 'admin@demo.com', '${DEMO_PASSWORD_HASH}', 'admin'),
            (UUID(), 'user@demo.com', '${DEMO_PASSWORD_HASH}', 'user')
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE \`users\``);
    }
}
