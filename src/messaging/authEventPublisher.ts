import { Kafka, logLevel, type Producer } from "kafkajs";
import { kafkaConfig } from "../config/env";
import type { AuthUserEvent } from "./authUserEvents";

let producer: Producer | null = null;
let connecting: Promise<Producer | null> | null = null;

function createProducer(): Producer {
    const kafka = new Kafka({
        clientId: `${kafkaConfig.clientId}-auth-producer`,
        brokers: kafkaConfig.brokers,
        logLevel: logLevel.ERROR,
        retry: { retries: 3, initialRetryTime: 300 },
    });
    return kafka.producer({ allowAutoTopicCreation: true });
}

async function getProducer(): Promise<Producer | null> {
    if (!kafkaConfig.enabled) return null;
    if (producer) return producer;
    if (!connecting) {
        connecting = (async () => {
            try {
                const p = createProducer();
                await p.connect();
                producer = p;
                console.log(
                    `[kafka] producer connected → ${kafkaConfig.brokers.join(",")} topic=${kafkaConfig.authUserTopic}`,
                );
                return p;
            } catch (err) {
                console.warn("[kafka] producer connect failed (Auth vẫn chạy):", err);
                connecting = null;
                return null;
            }
        })();
    }
    return connecting;
}

export async function publishAuthUserEvent(event: AuthUserEvent): Promise<void> {
    try {
        const p = await getProducer();
        if (!p) return;
        await p.send({
            topic: kafkaConfig.authUserTopic,
            messages: [
                {
                    key: event.userId,
                    value: JSON.stringify(event),
                    headers: { eventType: event.type },
                },
            ],
        });
        console.log(`[kafka] published ${event.type} userId=${event.userId}`);
    } catch (err) {
        console.warn(`[kafka] publish ${event.type} failed:`, err);
    }
}
