import "dotenv/config"
import "reflect-metadata"
import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser"
import { appConfig } from "./config/env"
import { PaymentDataSource } from "./modules/payment/data-source"
import paymentRoutes from "./modules/payment/routes/paymentRoutes"
import { errorHandler } from "./middlewares/errorHandler"
import { parseCorsOrigins } from "./utils/corsOrigins"

const app = express()
const corsOrigin = parseCorsOrigins(appConfig.corsOrigin)

app.use(
    cors({
        origin: corsOrigin,
        credentials: true,
    }),
)
app.use(express.json())
app.use(cookieParser())

app.get("/health", (_req, res) => {
    res.json({ status: "ok", service: "payment" })
})

app.use("/api/payments", paymentRoutes)
app.use(errorHandler)

PaymentDataSource.initialize()
    .then(() => {
        console.log("Payment service: đã kết nối Payment DB")
        app.listen(appConfig.port, () => {
            console.log(`Payment service lắng nghe port ${appConfig.port}`)
        })
    })
    .catch((error) => console.error("Payment service: lỗi DB", error))
