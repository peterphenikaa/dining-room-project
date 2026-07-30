import "reflect-metadata";
import { DataSource } from "typeorm";
import { dbConfig } from "../../config/env";
import { AuthIdentity } from "./entity/AuthIdentity";
import { User } from "./entity/User";

/** Auth DB only — users + auth_identities */
export const AuthDataSource = new DataSource({
    type: "mysql",
    host: dbConfig.host,
    port: dbConfig.port,
    username: dbConfig.user,
    password: dbConfig.password,
    database: dbConfig.name,
    synchronize: false,
    logging: false,
    entities: [User, AuthIdentity],
    migrations: [__dirname + "/migration/**/*{.ts,.js}"],
    subscribers: [],
});
