import "reflect-metadata"
import { DataSource } from "typeorm"
import { DiningRoom } from "./entity/DiningRoom"
import { DiningTable } from "./entity/DiningTable"
import { DiningChair } from "./entity/DiningChair"
import { DiningCabinet } from "./entity/DiningCabinet"
import { DiningAccessory } from "./entity/DiningAccessory"
import { User } from "./entity/User"

export const AppDataSource = new DataSource({
    type: "mysql",
    host: process.env.DB_HOST || "localhost",
    port: parseInt(process.env.DB_PORT || "3306"),
    username: process.env.DB_USER || "dbuser",
    password: process.env.DB_PASS || "dbpassword",
    database: process.env.DB_NAME || "phongan_db",
    synchronize: false, 
    logging: false,
    entities: [DiningRoom, DiningTable, DiningChair, DiningCabinet, DiningAccessory, User],
    migrations: [__dirname + "/migration/**/*{.ts,.js}"],
    subscribers: [],
})
