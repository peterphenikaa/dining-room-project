import "reflect-metadata"
import { DataSource } from "typeorm"
import { dbConfig } from "../../config/env"
import { Payment } from "./entity/Payment"

export const PaymentDataSource = new DataSource({
    type: "mysql",
    host: dbConfig.host,
    port: dbConfig.port,
    username: dbConfig.user,
    password: dbConfig.password,
    database: dbConfig.name,
    synchronize: false,
    logging: false,
    entities: [Payment],
    migrations: [__dirname + "/migration/**/*{.ts,.js}"],
    subscribers: [],
})
