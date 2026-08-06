import { MigrationInterface, QueryRunner } from "typeorm"

export class CreateOutboxEventsTable1784340000000 implements MigrationInterface {
    name = "CreateOutboxEventsTable1784340000000"

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE \`outbox_events\` (
                \`id\` varchar(36) NOT NULL,
                \`eventId\` varchar(36) NOT NULL,
                \`topic\` varchar(128) NOT NULL,
                \`eventType\` varchar(64) NOT NULL,
                \`aggregateType\` varchar(64) NOT NULL,
                \`aggregateId\` varchar(36) NOT NULL,
                \`payload\` json NOT NULL,
                \`status\` varchar(16) NOT NULL DEFAULT 'pending',
                \`attempts\` int NOT NULL DEFAULT 0,
                \`lastError\` text NULL,
                \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
                \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
                \`publishedAt\` datetime NULL,
                UNIQUE INDEX \`IDX_outbox_events_eventId\` (\`eventId\`),
                INDEX \`IDX_outbox_events_eventType\` (\`eventType\`),
                INDEX \`IDX_outbox_events_aggregateId\` (\`aggregateId\`),
                INDEX \`IDX_outbox_events_status\` (\`status\`),
                PRIMARY KEY (\`id\`)
            ) ENGINE=InnoDB
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE \`outbox_events\``)
    }
}
