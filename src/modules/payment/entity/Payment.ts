import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    Index,
} from "typeorm"

export type PaymentStatus = "pending" | "paid" | "cancelled"
export type PaymentProvider = "manual" | "payos"

@Entity("payments")
export class Payment {
    @PrimaryGeneratedColumn("uuid")
    id: string

    @Index({ unique: true })
    @Column({ type: "varchar", length: 36 })
    orderId: string

    @Column({ type: "varchar", length: 32 })
    orderNumber: string

    @Index()
    @Column({ type: "varchar", length: 36 })
    userId: string

    @Column({ type: "varchar", length: 16, default: "manual" })
    provider: PaymentProvider

    @Column({ type: "varchar", length: 16, default: "pending" })
    status: PaymentStatus

    @Column({ type: "int" })
    amount: number

    @Index({ unique: true })
    @Column({ type: "bigint", nullable: true })
    orderCode: string | null

    @Column({ type: "varchar", length: 128, nullable: true })
    providerPaymentId: string | null

    @Column({ type: "varchar", length: 500, nullable: true })
    checkoutUrl: string | null

    @Column({ type: "datetime", nullable: true })
    paidAt: Date | null

    @CreateDateColumn({ type: "datetime" })
    createdAt: Date

    @UpdateDateColumn({ type: "datetime" })
    updatedAt: Date
}
