import {
    Column,
    CreateDateColumn,
    Entity,
    Index,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from "typeorm"

export type OutboxStatus = "pending" | "published" | "failed"

@Entity("outbox_events")
export class OutboxEvent {
    @PrimaryGeneratedColumn("uuid")
    id: string

    @Index({ unique: true })
    @Column({ type: "varchar", length: 36 })
    eventId: string

    @Column({ type: "varchar", length: 128 })
    topic: string

    @Index()
    @Column({ type: "varchar", length: 64 })
    eventType: string

    @Column({ type: "varchar", length: 64 })
    aggregateType: string

    @Index()
    @Column({ type: "varchar", length: 36 })
    aggregateId: string

    @Column({ type: "json" })
    payload: Record<string, unknown>

    @Index()
    @Column({ type: "varchar", length: 16, default: "pending" })
    status: OutboxStatus

    @Column({ type: "int", default: 0 })
    attempts: number

    @Column({ type: "text", nullable: true })
    lastError: string | null

    @CreateDateColumn({ type: "datetime" })
    createdAt: Date

    @UpdateDateColumn({ type: "datetime" })
    updatedAt: Date

    @Column({ type: "datetime", nullable: true })
    publishedAt: Date | null
}
