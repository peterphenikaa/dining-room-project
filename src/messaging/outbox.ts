import { randomUUID } from "crypto"
import type { EntityManager } from "typeorm"
import { kafkaConfig } from "../config/env"
import { OutboxEvent } from "../entity/OutboxEvent"
import type { OrderEvent } from "./orderEvents"

export async function enqueueOrderOutbox(
    manager: EntityManager,
    event: Omit<OrderEvent, "eventId"> & { eventId?: string },
): Promise<OutboxEvent> {
    const eventId = event.eventId || randomUUID()
    const payload: OrderEvent = { ...event, eventId, type: "OrderCreated" }

    const row = manager.create(OutboxEvent, {
        eventId,
        topic: kafkaConfig.orderTopic,
        eventType: payload.type,
        aggregateType: "Order",
        aggregateId: payload.orderId,
        payload,
        status: "pending",
        attempts: 0,
        lastError: null,
        publishedAt: null,
    })
    return manager.save(row)
}
