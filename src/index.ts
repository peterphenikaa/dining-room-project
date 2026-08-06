import "dotenv/config"
import "reflect-metadata"
import http from "http"
import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser"
import { createProxyMiddleware } from "http-proxy-middleware"
import { appConfig, authServiceConfig, paymentServiceConfig } from "./config/env"
import { AppDataSource } from "./data-source"

import diningRoomRoutes from "./routes/diningRoomRoutes"
import diningTableRoutes from "./routes/diningTableRoutes"
import diningChairRoutes from "./routes/diningChairRoutes"
import diningAccessoryRoutes from "./routes/diningAccessoryRoutes"
import diningCabinetRoutes from "./routes/diningCabinetRoutes"
import cartRoutes from "./routes/cartRoutes"
import orderRoutes from "./routes/orderRoutes"
import { internalMarkPaid } from "./controllers/OrderController"
import { errorHandler } from "./middlewares/errorHandler"
import { initIO } from "./realtime/io"
import { startOutboxRelay } from "./messaging/outboxRelay"
import { ensureBucket } from "./storage/s3"
import { parseCorsOrigins } from "./utils/corsOrigins"

const app = express()

const corsOrigin = parseCorsOrigins(appConfig.corsOrigin)
app.use(
    cors({
        origin: corsOrigin,
        credentials: true,
    }),
)

function makeAuthProxy(pathPrefix: "/api/auth" | "/api/users") {
    const timeout = authServiceConfig.proxyTimeoutMs
    return createProxyMiddleware({
        target: authServiceConfig.url,
        changeOrigin: true,
        xfwd: true,
        proxyTimeout: timeout,
        timeout,
        pathRewrite: (path) => `${pathPrefix}${path}`,
        on: {
            error(err, _req, res) {
                console.error("Auth proxy error:", err.message)
                const serverRes = res as http.ServerResponse | undefined
                if (serverRes && typeof serverRes.writeHead === "function" && !serverRes.headersSent) {
                    serverRes.writeHead(502, { "Content-Type": "application/json" })
                    serverRes.end(
                        JSON.stringify({
                            status: "error",
                            statusCode: 502,
                            message: "Auth service không phản hồi",
                        }),
                    )
                }
            },
        },
    })
}

function makePaymentProxy() {
    const timeout = paymentServiceConfig.proxyTimeoutMs
    return createProxyMiddleware({
        target: paymentServiceConfig.url,
        changeOrigin: true,
        xfwd: true,
        proxyTimeout: timeout,
        timeout,
        pathRewrite: (path) => `/api/payments${path}`,
        on: {
            error(err, _req, res) {
                console.error("Payment proxy error:", err.message)
                const serverRes = res as http.ServerResponse | undefined
                if (serverRes && typeof serverRes.writeHead === "function" && !serverRes.headersSent) {
                    serverRes.writeHead(502, { "Content-Type": "application/json" })
                    serverRes.end(
                        JSON.stringify({
                            status: "error",
                            statusCode: 502,
                            message: "Payment service không phản hồi",
                        }),
                    )
                }
            },
        },
    })
}

app.use("/api/auth", makeAuthProxy("/api/auth"))
app.use("/api/users", makeAuthProxy("/api/users"))
app.use("/api/payments", makePaymentProxy())

app.use(express.json())
app.use(cookieParser())

const server = http.createServer(app)

async function checkServiceHealth(
    url: string,
    timeoutMs: number,
): Promise<"up" | "down"> {
    try {
        const ctrl = AbortSignal.timeout(timeoutMs)
        const res = await fetch(`${url}/health`, { signal: ctrl })
        return res.ok ? "up" : "down"
    } catch {
        return "down"
    }
}

AppDataSource.initialize()
    .then(async () => {
        console.log("Dining API: đã kết nối Dining DB")

        try {
            await ensureBucket()
            console.log("MinIO bucket sẵn sàng")
        } catch (err) {
            console.warn("MinIO chưa sẵn sàng (ảnh upload sẽ lỗi đến khi MinIO up):", err)
        }

        app.get("/", (_req, res) => {
            res.json({ message: "API Quản lý Phòng ăn và Bàn ăn" })
        })

        app.get("/health", async (_req, res) => {
            const [auth, payment] = await Promise.all([
                checkServiceHealth(authServiceConfig.url, authServiceConfig.healthTimeoutMs),
                checkServiceHealth(
                    paymentServiceConfig.url,
                    paymentServiceConfig.healthTimeoutMs,
                ),
            ])
            const ok = auth === "up" && payment === "up"
            const body = {
                status: ok ? "ok" : "degraded",
                service: "dining",
                auth,
                payment,
                authProxy: authServiceConfig.url,
                paymentProxy: paymentServiceConfig.url,
            }
            res.status(ok ? 200 : 503).json(body)
        })

        app.use("/api/rooms", diningRoomRoutes)
        app.use("/api/tables", diningTableRoutes)
        app.use("/api/chairs", diningChairRoutes)
        app.use("/api/accessories", diningAccessoryRoutes)
        app.use("/api/cabinets", diningCabinetRoutes)
        app.use("/api/cart", cartRoutes)
        app.post("/api/orders/internal/mark-paid", internalMarkPaid)
        app.use("/api/orders", orderRoutes)

        app.use(errorHandler)

        initIO(server, corsOrigin)
        startOutboxRelay()

        const authStatus = await checkServiceHealth(
            authServiceConfig.url,
            authServiceConfig.healthTimeoutMs,
        )
        const paymentStatus = await checkServiceHealth(
            paymentServiceConfig.url,
            paymentServiceConfig.healthTimeoutMs,
        )
        console.log(`Auth health: ${authStatus} (${authServiceConfig.url})`)
        console.log(`Payment health: ${paymentStatus} (${paymentServiceConfig.url})`)

        server.listen(appConfig.port, () => {
            console.log(
                `Dining API + Socket.IO port ${appConfig.port} (auth → ${authServiceConfig.url}, payment → ${paymentServiceConfig.url})`,
            )
        })
    })
    .catch((error) => console.log("Lỗi kết nối cơ sở dữ liệu: ", error))
