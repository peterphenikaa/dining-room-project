import "dotenv/config";
import "reflect-metadata";
import { AppDataSource } from "./data-source";
import { ensureBucket } from "./storage/s3";
import { startProcessImageWorker } from "./workers/processImageWorker";

async function main() {
    await AppDataSource.initialize();
    console.log("[worker] DB connected");

    await ensureBucket();
    console.log("[worker] MinIO bucket ready");

    startProcessImageWorker();
    console.log("[worker] BullMQ workers đang chạy (process-image)");
}

main().catch((err) => {
    console.error("[worker] khởi động thất bại:", err);
    process.exit(1);
});
