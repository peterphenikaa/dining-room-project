import { MigrationInterface, QueryRunner } from "typeorm";

export class InitTables1784258408995 implements MigrationInterface {
    name = 'InitTables1784258408995'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`dining_chair\` (\`id\` varchar(36) NOT NULL, \`name\` varchar(255) NOT NULL, \`material\` varchar(255) NOT NULL, \`color\` varchar(255) NULL, \`diningTableId\` varchar(36) NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`dining_accessory\` (\`id\` varchar(36) NOT NULL, \`name\` varchar(255) NOT NULL, \`type\` varchar(255) NOT NULL, \`diningTableId\` varchar(36) NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`dining_table\` (\`id\` varchar(36) NOT NULL, \`name\` varchar(255) NOT NULL, \`material\` varchar(255) NOT NULL, \`shape\` varchar(255) NOT NULL, \`dimensions\` varchar(255) NULL, \`diningRoomId\` varchar(36) NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`dining_cabinet\` (\`id\` varchar(36) NOT NULL, \`name\` varchar(255) NOT NULL, \`material\` varchar(255) NOT NULL, \`dimensions\` varchar(255) NULL, \`diningRoomId\` varchar(36) NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`dining_room\` (\`id\` varchar(36) NOT NULL, \`name\` varchar(255) NOT NULL, \`area_size\` float NOT NULL, \`style\` varchar(255) NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`ALTER TABLE \`dining_chair\` ADD CONSTRAINT \`FK_e561d9960aa768cb6b8ba5a32ee\` FOREIGN KEY (\`diningTableId\`) REFERENCES \`dining_table\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`dining_accessory\` ADD CONSTRAINT \`FK_63fae9e90e48d417d1332ea612b\` FOREIGN KEY (\`diningTableId\`) REFERENCES \`dining_table\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`dining_table\` ADD CONSTRAINT \`FK_10c9d143a3914093c28d19978e8\` FOREIGN KEY (\`diningRoomId\`) REFERENCES \`dining_room\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`dining_cabinet\` ADD CONSTRAINT \`FK_5958c80d37ce6ad6ec5ca38ebe4\` FOREIGN KEY (\`diningRoomId\`) REFERENCES \`dining_room\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`dining_cabinet\` DROP FOREIGN KEY \`FK_5958c80d37ce6ad6ec5ca38ebe4\``);
        await queryRunner.query(`ALTER TABLE \`dining_table\` DROP FOREIGN KEY \`FK_10c9d143a3914093c28d19978e8\``);
        await queryRunner.query(`ALTER TABLE \`dining_accessory\` DROP FOREIGN KEY \`FK_63fae9e90e48d417d1332ea612b\``);
        await queryRunner.query(`ALTER TABLE \`dining_chair\` DROP FOREIGN KEY \`FK_e561d9960aa768cb6b8ba5a32ee\``);
        await queryRunner.query(`DROP TABLE \`dining_room\``);
        await queryRunner.query(`DROP TABLE \`dining_cabinet\``);
        await queryRunner.query(`DROP TABLE \`dining_table\``);
        await queryRunner.query(`DROP TABLE \`dining_accessory\``);
        await queryRunner.query(`DROP TABLE \`dining_chair\``);
    }

}
