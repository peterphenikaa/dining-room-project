import { MigrationInterface, QueryRunner } from "typeorm"

export class CreatePaymentsTable1784320000000 implements MigrationInterface {
    name = "CreatePaymentsTable1784320000000"

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE \`payments\` (
                \`id\` varchar(36) NOT NULL,
                \`orderId\` varchar(36) NOT NULL,
                \`orderNumber\` varchar(32) NOT NULL,
                \`userId\` varchar(36) NOT NULL,
                \`provider\` varchar(16) NOT NULL DEFAULT 'manual',
                \`status\` varchar(16) NOT NULL DEFAULT 'pending',
                \`amount\` int NOT NULL,
                \`providerPaymentId\` varchar(128) NULL,
                \`checkoutUrl\` varchar(500) NULL,
                \`paidAt\` datetime NULL,
                \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
                \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
                UNIQUE INDEX \`IDX_payments_orderId\` (\`orderId\`),
                INDEX \`IDX_payments_userId\` (\`userId\`),
                PRIMARY KEY (\`id\`)
            ) ENGINE=InnoDB
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE \`payments\``)
    }
}
