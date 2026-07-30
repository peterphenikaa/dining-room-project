import "dotenv/config";
import "reflect-metadata";
import http from "http";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { createProxyMiddleware } from "http-proxy-middleware";
import { appConfig, authServiceConfig } from "./config/env";
import { AppDataSource } from "./data-source";

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
    }),
);

function makeAuthProxy(pathPrefix: "/api/auth" | "/api/users") {
    const timeout = authServiceConfig.proxyTimeoutMs;
    return createProxyMiddleware({
        target: authServiceConfig.url,
        changeOrigin: true,
        xfwd: true,
        proxyTimeout: timeout,
        timeout,
        pathRewrite: (path) => `${pathPrefix}${path}`,
        on: {
            error(err, _req, res) {
                console.error("Auth proxy error:", err.message);
                const serverRes = res as http.ServerResponse | undefined;
                if (serverRes && typeof serverRes.writeHead === "function" && !serverRes.headersSent) {
                    serverRes.writeHead(502, { "Content-Type": "application/json" });
                    serverRes.end(
                        JSON.stringify({
                            status: "error",
                            statusCode: 502,
                            message: "Auth service không phản hồi",
                        }),
                    );
                }
            },
        },
    });
}

app.use("/api/auth", makeAuthProxy("/api/auth"));
app.use("/api/users", makeAuthProxy("/api/users"));

app.use(express.json());
app.use(cookieParser());

const server = http.createServer(app);

async function checkAuthHealth(): Promise<"up" | "down"> {
    try {
        const ctrl = AbortSignal.timeout(authServiceConfig.healthTimeoutMs);
        const res = await fetch(`${authServiceConfig.url}/health`, { signal: ctrl });
        return res.ok ? "up" : "down";
    } catch {
        return "down";
    }
}

AppDataSource.initialize()
    .then(async () => {
        console.log("Dining API: đã kết nối Dining DB");

        try {
            await ensureBucket();
            console.log("MinIO bucket sẵn sàng");
        } catch (err) {
            console.warn("MinIO chưa sẵn sàng (ảnh upload sẽ lỗi đến khi MinIO up):", err);
        }

        app.get("/", (_req, res) => {
            res.json({ message: "API Quản lý Phòng ăn và Bàn ăn" });
        });

        app.get("/health", async (_req, res) => {
            const auth = await checkAuthHealth();
            const body = {
                status: auth === "up" ? "ok" : "degraded",
                service: "dining",
                auth,
                authProxy: authServiceConfig.url,
            };
            res.status(auth === "up" ? 200 : 503).json(body);
        });

        app.use("/api/rooms", diningRoomRoutes);
        app.use("/api/tables", diningTableRoutes);
        app.use("/api/chairs", diningChairRoutes);
        app.use("/api/accessories", diningAccessoryRoutes);
        app.use("/api/cabinets", diningCabinetRoutes);

        app.use(errorHandler);

        initIO(server, corsOrigin);

        const authStatus = await checkAuthHealth();
        console.log(`Auth health: ${authStatus} (${authServiceConfig.url})`);

        server.listen(appConfig.port, () => {
            console.log(
                `Dining API + Socket.IO port ${appConfig.port} (auth → ${authServiceConfig.url})`,
            );
        });
    })
    .catch((error) => console.log("Lỗi kết nối cơ sở dữ liệu: ", error));
