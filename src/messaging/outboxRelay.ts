import { AppDataSource } from "../data-source"
import { OutboxEvent } from "../entity/OutboxEvent"
import { kafkaConfig } from "../config/env"
import { publishOrderEventRaw } from "./orderEventPublisher"
import type { OrderEvent } from "./orderEvents"

const BATCH = 20
const MAX_ATTEMPTS = 10
const POLL_MS = 2_000

let timer: NodeJS.Timeout | null = null
let running = false

async function claimBatch(): Promise<OutboxEvent[]> {
    return AppDataSource.transaction(async (manager) => {
        const rows: Array<{ id: string }> = await manager.query(
            `
            SELECT id
            FROM outbox_events
            WHERE status IN ('pending', 'failed')
              AND attempts < ?
            ORDER BY createdAt ASC
            LIMIT ?
            FOR UPDATE SKIP LOCKED
            `,
            [MAX_ATTEMPTS, BATCH],
        )

        if (!rows.length) return []

        const ids = rows.map((r) => r.id)
        const entities = await manager
            .getRepository(OutboxEvent)
            .createQueryBuilder("o")
            .where("o.id IN (:...ids)", { ids })
            .getMany()

        for (const e of entities) {
            e.attempts += 1
            e.status = "pending"
        }
        await manager.save(entities)
        return entities
    })
}

async function publishOne(row: OutboxEvent): Promise<void> {
    const repo = AppDataSource.getRepository(OutboxEvent)
    try {
        const payload = row.payload as unknown as OrderEvent
        await publishOrderEventRaw(row.topic, payload)
        row.status = "published"
        row.publishedAt = new Date()
        row.lastError = null
        await repo.save(row)
        console.log(
            `[outbox] published ${row.eventType} eventId=${row.eventId} aggregateId=${row.aggregateId}`,
        )
    } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        row.status = "failed"
        row.lastError = msg.slice(0, 2000)
        await repo.save(row)
        console.warn(
            `[outbox] publish failed eventId=${row.eventId} attempts=${row.attempts}:`,
            msg,
        )
    }
}

async function tick(): Promise<void> {
    if (running) return
    if (!kafkaConfig.enabled) return
    running = true
    try {
        const batch = await claimBatch()
        for (const row of batch) {
            await publishOne(row)
        }
    } catch (err) {
        console.warn("[outbox] relay tick error:", err)
    } finally {
        running = false
    }
}

export function startOutboxRelay(): void {
    if (timer) return
    if (!kafkaConfig.enabled) {
        console.log("[outbox] KAFKA_ENABLED=false — relay không chạy")
        return
    }
    console.log(`[outbox] relay started poll=${POLL_MS}ms topic=${kafkaConfig.orderTopic}`)
    void tick()
    timer = setInterval(() => void tick(), POLL_MS)
}

export function stopOutboxRelay(): void {
    if (timer) {
        clearInterval(timer)
        timer = null
    }
}
