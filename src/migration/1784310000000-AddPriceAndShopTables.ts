import { MigrationInterface, QueryRunner } from "typeorm"

export class AddPriceAndShopTables1784310000000 implements MigrationInterface {
    name = "AddPriceAndShopTables1784310000000"

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE \`dining_table\` ADD \`price\` int NOT NULL DEFAULT 0`
        )
        await queryRunner.query(
            `ALTER TABLE \`dining_cabinet\` ADD \`price\` int NOT NULL DEFAULT 0`
        )
        await queryRunner.query(
            `ALTER TABLE \`dining_chair\` ADD \`price\` int NOT NULL DEFAULT 0`
        )
        await queryRunner.query(
            `ALTER TABLE \`dining_accessory\` ADD \`price\` int NOT NULL DEFAULT 0`
        )

        await queryRunner.query(`
            CREATE TABLE \`carts\` (
                \`id\` varchar(36) NOT NULL,
                \`userId\` varchar(36) NOT NULL,
                \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
                \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
                UNIQUE INDEX \`IDX_carts_userId\` (\`userId\`),
                PRIMARY KEY (\`id\`)
            ) ENGINE=InnoDB
        `)

        await queryRunner.query(`
            CREATE TABLE \`cart_items\` (
                \`id\` varchar(36) NOT NULL,
                \`cartId\` varchar(36) NOT NULL,
                \`productType\` varchar(32) NOT NULL,
                \`productId\` varchar(36) NOT NULL,
                \`quantity\` int NOT NULL,
                \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
                \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
                UNIQUE INDEX \`IDX_cart_items_cart_product\` (\`cartId\`, \`productType\`, \`productId\`),
                PRIMARY KEY (\`id\`)
            ) ENGINE=InnoDB
        `)

        await queryRunner.query(`
            CREATE TABLE \`orders\` (
                \`id\` varchar(36) NOT NULL,
                \`orderNumber\` varchar(32) NOT NULL,
                \`userId\` varchar(36) NOT NULL,
                \`status\` varchar(32) NOT NULL DEFAULT 'pending_payment',
                \`totalAmount\` int NOT NULL,
                \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
                \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
                UNIQUE INDEX \`IDX_orders_orderNumber\` (\`orderNumber\`),
                INDEX \`IDX_orders_userId\` (\`userId\`),
                PRIMARY KEY (\`id\`)
            ) ENGINE=InnoDB
        `)

        await queryRunner.query(`
            CREATE TABLE \`order_items\` (
                \`id\` varchar(36) NOT NULL,
                \`orderId\` varchar(36) NOT NULL,
                \`productType\` varchar(32) NOT NULL,
                \`productId\` varchar(36) NOT NULL,
                \`productName\` varchar(255) NOT NULL,
                \`unitPrice\` int NOT NULL,
                \`quantity\` int NOT NULL,
                \`lineTotal\` int NOT NULL,
                \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
                PRIMARY KEY (\`id\`)
            ) ENGINE=InnoDB
        `)

        await queryRunner.query(`
            ALTER TABLE \`cart_items\`
            ADD CONSTRAINT \`FK_cart_items_cart\`
            FOREIGN KEY (\`cartId\`) REFERENCES \`carts\`(\`id\`)
            ON DELETE CASCADE ON UPDATE NO ACTION
        `)

        await queryRunner.query(`
            ALTER TABLE \`order_items\`
            ADD CONSTRAINT \`FK_order_items_order\`
            FOREIGN KEY (\`orderId\`) REFERENCES \`orders\`(\`id\`)
            ON DELETE CASCADE ON UPDATE NO ACTION
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE \`order_items\` DROP FOREIGN KEY \`FK_order_items_order\``
        )
        await queryRunner.query(
            `ALTER TABLE \`cart_items\` DROP FOREIGN KEY \`FK_cart_items_cart\``
        )
        await queryRunner.query(`DROP TABLE \`order_items\``)
        await queryRunner.query(`DROP TABLE \`orders\``)
        await queryRunner.query(`DROP TABLE \`cart_items\``)
        await queryRunner.query(`DROP TABLE \`carts\``)
        await queryRunner.query(
            `ALTER TABLE \`dining_accessory\` DROP COLUMN \`price\``
        )
        await queryRunner.query(
            `ALTER TABLE \`dining_chair\` DROP COLUMN \`price\``
        )
        await queryRunner.query(
            `ALTER TABLE \`dining_cabinet\` DROP COLUMN \`price\``
        )
        await queryRunner.query(
            `ALTER TABLE \`dining_table\` DROP COLUMN \`price\``
        )
    }
}
