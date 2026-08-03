import { Kafka, logLevel, type Producer } from "kafkajs"
import { kafkaConfig } from "../config/env"
import type { OrderEvent } from "./orderEvents"

let producer: Producer | null = null
let connecting: Promise<Producer | null> | null = null

function createProducer(): Producer {
    const kafka = new Kafka({
        clientId: `${kafkaConfig.clientId}-order-producer`,
        brokers: kafkaConfig.brokers,
        logLevel: logLevel.ERROR,
        retry: { retries: 3, initialRetryTime: 300 },
    })
    return kafka.producer({ allowAutoTopicCreation: true })
}

async function getProducer(): Promise<Producer | null> {
    if (!kafkaConfig.enabled) return null
    if (producer) return producer
    if (!connecting) {
        connecting = (async () => {
            try {
                const p = createProducer()
                await p.connect()
                producer = p
                console.log(
                    `[kafka] order producer → ${kafkaConfig.brokers.join(",")} topic=${kafkaConfig.orderTopic}`,
                )
                return p
            } catch (err) {
                console.warn("[kafka] order producer connect failed:", err)
                connecting = null
                return null
            }
        })()
    }
    return connecting
}

export async function publishOrderEvent(event: OrderEvent): Promise<void> {
    try {
        const p = await getProducer()
        if (!p) return
        await p.send({
            topic: kafkaConfig.orderTopic,
            messages: [
                {
                    key: event.orderId,
                    value: JSON.stringify(event),
                    headers: { eventType: event.type },
                },
            ],
        })
        console.log(`[kafka] published ${event.type} orderId=${event.orderId}`)
    } catch (err) {
        console.warn(`[kafka] publish ${event.type} failed:`, err)
    }
}
