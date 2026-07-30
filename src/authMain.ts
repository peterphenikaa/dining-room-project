import "dotenv/config";
import "reflect-metadata";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { appConfig } from "./config/env";
import { AuthDataSource } from "./modules/auth/data-source";
import authRoutes from "./modules/auth/routes/authRoutes";
import userRoutes from "./modules/auth/routes/userRoutes";
import { errorHandler } from "./middlewares/errorHandler";
import { parseCorsOrigins } from "./utils/corsOrigins";

const app = express();
const corsOrigin = parseCorsOrigins(appConfig.corsOrigin);

app.use(
    cors({
        origin: corsOrigin,
        credentials: true,
    }),
);
app.use(express.json());
app.use(cookieParser());

app.get("/health", (_req, res) => {
    res.json({ status: "ok", service: "auth" });
});

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use(errorHandler);

AuthDataSource.initialize()
    .then(() => {
        console.log("Auth service: đã kết nối Auth DB");
        app.listen(appConfig.port, () => {
            console.log(`Auth service lắng nghe port ${appConfig.port}`);
        });
    })
    .catch((error) => console.error("Auth service: lỗi DB", error));
