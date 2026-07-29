import "dotenv/config";
import "reflect-metadata";
import http from "http";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { appConfig } from "./config/env";
import { AppDataSource } from "./data-source";

import authRoutes from "./routes/authRoutes";
import userRoutes from "./routes/userRoutes";
import diningRoomRoutes from "./routes/diningRoomRoutes";
import diningTableRoutes from "./routes/diningTableRoutes";
import diningChairRoutes from "./routes/diningChairRoutes";
import diningAccessoryRoutes from "./routes/diningAccessoryRoutes";
import diningCabinetRoutes from "./routes/diningCabinetRoutes";
import { errorHandler } from "./middlewares/errorHandler";
import { initIO } from "./realtime/io";
import { ensureBucket } from "./storage/s3";
import { parseCorsOrigins } from "./utils/corsOrigins";

const app = express();

const corsOrigin = parseCorsOrigins(appConfig.corsOrigin);
app.use(
    cors({
        origin: corsOrigin,
        credentials: true,
    })
);
app.use(express.json());
app.use(cookieParser());

const server = http.createServer(app);

AppDataSource.initialize()
    .then(async () => {
        console.log("Đã kết nối thành công tới Database MySQL qua TypeORM!");

        try {
            await ensureBucket();
            console.log("MinIO bucket sẵn sàng");
        } catch (err) {
            console.warn("MinIO chưa sẵn sàng (ảnh upload sẽ lỗi đến khi MinIO up):", err);
        }

        app.get("/", (req, res) => {
            res.json({ message: "API Quản lý Phòng ăn và Bàn ăn" });
        });

        app.use("/api/auth", authRoutes);
        app.use("/api/users", userRoutes);
        app.use("/api/rooms", diningRoomRoutes);
        app.use("/api/tables", diningTableRoutes);
        app.use("/api/chairs", diningChairRoutes);
        app.use("/api/accessories", diningAccessoryRoutes);
        app.use("/api/cabinets", diningCabinetRoutes);

        app.use(errorHandler);

        initIO(server, corsOrigin);

        server.listen(appConfig.port, () => {
            console.log(`Express + Socket.IO đã khởi chạy trên port ${appConfig.port}`);
        });
    })
    .catch((error) => console.log("Lỗi kết nối cơ sở dữ liệu: ", error));
