import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateAuthIdentitiesTable1784290000000 implements MigrationInterface {
    name = "CreateAuthIdentitiesTable1784290000000";

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE \`auth_identities\` (
                \`id\` varchar(36) NOT NULL,
                \`userId\` varchar(36) NOT NULL,
                \`provider\` varchar(32) NOT NULL,
                \`providerSubject\` varchar(255) NOT NULL,
                \`email\` varchar(255) NULL,
                \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
                INDEX \`IDX_auth_identities_userId\` (\`userId\`),
                UNIQUE INDEX \`UQ_auth_identities_provider_subject\` (\`provider\`, \`providerSubject\`),
                UNIQUE INDEX \`UQ_auth_identities_user_provider\` (\`userId\`, \`provider\`),
                PRIMARY KEY (\`id\`),
                CONSTRAINT \`FK_auth_identities_user\`
                    FOREIGN KEY (\`userId\`) REFERENCES \`users\`(\`id\`)
                    ON DELETE CASCADE ON UPDATE NO ACTION
            ) ENGINE=InnoDB
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE \`auth_identities\``);
    }
}
