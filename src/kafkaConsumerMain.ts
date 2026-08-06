import "dotenv/config"
import { Kafka, logLevel } from "kafkajs"
import { kafkaConfig } from "./config/env"
import type { AuthUserEvent } from "./messaging/authUserEvents"
import type { OrderEvent } from "./messaging/orderEvents"

async function main() {
    if (!kafkaConfig.enabled) {
        console.log("[kafka-consumer] KAFKA_ENABLED=false — thoát")
        return
    }

    const kafka = new Kafka({
        clientId: `${kafkaConfig.clientId}-consumer`,
        brokers: kafkaConfig.brokers,
        logLevel: logLevel.ERROR,
        retry: { retries: 8, initialRetryTime: 500 },
    })

    const consumer = kafka.consumer({ groupId: kafkaConfig.consumerGroup })

    const shutdown = async () => {
        console.log("[kafka-consumer] shutting down...")
        await consumer.disconnect()
        process.exit(0)
    }
    process.on("SIGINT", () => void shutdown())
    process.on("SIGTERM", () => void shutdown())

    await consumer.connect()
    await consumer.subscribe({
        topic: kafkaConfig.authUserTopic,
        fromBeginning: false,
    })
    await consumer.subscribe({
        topic: kafkaConfig.orderTopic,
        fromBeginning: false,
    })

    console.log(
        `[kafka-consumer] topics=${kafkaConfig.authUserTopic},${kafkaConfig.orderTopic} group=${kafkaConfig.consumerGroup} brokers=${kafkaConfig.brokers.join(",")}`,
    )

    await consumer.run({
        eachMessage: async ({ topic, partition, message }) => {
            const raw = message.value?.toString("utf8") || ""
            try {
                const event = JSON.parse(raw) as AuthUserEvent | OrderEvent
                if (event.type === "UserCreated") {
                    console.log(
                        `[notify] Welcome ${event.email} (role=${event.role}, source=${event.source})`,
                    )
                } else if (event.type === "UserRoleChanged") {
                    console.log(
                        `[notify] ${event.email}: ${event.fromRole} → ${event.toRole} (by ${event.actorId})`,
                    )
                } else if (event.type === "OrderCreated") {
                    console.log(
                        `[notify] Order ${event.orderNumber} eventId=${(event as OrderEvent).eventId || "-"} user=${event.userId} total=${event.totalAmount} items=${event.itemCount}`,
                    )
                } else {
                    console.log(`[kafka-consumer] unknown event on ${topic}/${partition}:`, raw)
                }
            } catch {
                console.warn(`[kafka-consumer] bad message ${topic}[${partition}]:`, raw)
            }
        },
    })
}

main().catch((err) => {
    console.error("[kafka-consumer] fatal:", err)
    process.exit(1)
})
