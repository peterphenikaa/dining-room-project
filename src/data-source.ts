import "reflect-metadata"
import { DataSource } from "typeorm"
import { dbConfig } from "./config/env"
import { DiningRoom } from "./entity/DiningRoom"
import { DiningTable } from "./entity/DiningTable"
import { DiningChair } from "./entity/DiningChair"
import { DiningCabinet } from "./entity/DiningCabinet"
import { DiningAccessory } from "./entity/DiningAccessory"
import { Cart } from "./entity/Cart"
import { CartItem } from "./entity/CartItem"
import { Order } from "./entity/Order"
import { OrderItem } from "./entity/OrderItem"
import { OutboxEvent } from "./entity/OutboxEvent"

export const AppDataSource = new DataSource({
    type: "mysql",
    host: dbConfig.host,
    port: dbConfig.port,
    username: dbConfig.user,
    password: dbConfig.password,
    database: dbConfig.name,
    synchronize: false,
    logging: false,
    entities: [
        DiningRoom,
        DiningTable,
        DiningChair,
        DiningCabinet,
        DiningAccessory,
        Cart,
        CartItem,
        Order,
        OrderItem,
        OutboxEvent,
    ],
    migrations: [__dirname + "/migration/**/*{.ts,.js}"],
    subscribers: [],
})
