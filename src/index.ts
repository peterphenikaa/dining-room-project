import "dotenv/config";
import "reflect-metadata";
import http from "http";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { AppDataSource } from "./data-source";

import authRoutes from "./routes/authRoutes";
import diningRoomRoutes from "./routes/diningRoomRoutes";
import diningTableRoutes from "./routes/diningTableRoutes";
import diningChairRoutes from "./routes/diningChairRoutes";
import diningAccessoryRoutes from "./routes/diningAccessoryRoutes";
import diningCabinetRoutes from "./routes/diningCabinetRoutes";
import { errorHandler } from "./middlewares/errorHandler";
import { initIO } from "./realtime/io";

const app = express();

const corsOrigin = process.env.CORS_ORIGIN || "http://localhost:5173";
app.use(
    cors({
        origin: corsOrigin,
        credentials: true,
    })
);
app.use(express.json());
app.use(cookieParser());

const PORT = process.env.PORT || 3002;
const server = http.createServer(app);

AppDataSource.initialize()
    .then(async () => {
        console.log("Đã kết nối thành công tới Database MySQL qua TypeORM!");

        app.get("/", (req, res) => {
            res.json({ message: "API Quản lý Phòng ăn và Bàn ăn" });
        });

        app.use("/api/auth", authRoutes);
        app.use("/api/rooms", diningRoomRoutes);
        app.use("/api/tables", diningTableRoutes);
        app.use("/api/chairs", diningChairRoutes);
        app.use("/api/accessories", diningAccessoryRoutes);
        app.use("/api/cabinets", diningCabinetRoutes);

        app.use(errorHandler);

        initIO(server, corsOrigin);

        server.listen(PORT, () => {
            console.log(`Express + Socket.IO đã khởi chạy trên port ${PORT}`);
        });
    })
    .catch((error) => console.log("Lỗi kết nối cơ sở dữ liệu: ", error));
