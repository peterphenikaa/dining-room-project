import "reflect-metadata";
import express from "express";
import cors from "cors";
import { AppDataSource } from "./data-source";

import diningRoomRoutes from "./routes/diningRoomRoutes";
import diningTableRoutes from "./routes/diningTableRoutes";
import diningChairRoutes from "./routes/diningChairRoutes";
import diningAccessoryRoutes from "./routes/diningAccessoryRoutes";
import diningCabinetRoutes from "./routes/diningCabinetRoutes";
import { errorHandler } from "./middlewares/errorHandler";

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3002;

AppDataSource.initialize()
    .then(async () => {
        console.log("Đã kết nối thành công tới Database MySQL qua TypeORM!");

        app.get("/", (req, res) => {
            res.json({ message: "API Quản lý Phòng ăn và Bàn ăn" });
        });

        app.use("/api/rooms", diningRoomRoutes);
        app.use("/api/tables", diningTableRoutes);
        app.use("/api/chairs", diningChairRoutes);
        app.use("/api/accessories", diningAccessoryRoutes);
        app.use("/api/cabinets", diningCabinetRoutes);

        app.use(errorHandler);

        app.listen(PORT, () => {
            console.log(`Express server đã khởi chạy trên port ${PORT}`);
        });
    })
    .catch((error) => console.log("Lỗi kết nối cơ sở dữ liệu: ", error));
