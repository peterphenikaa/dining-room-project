import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    OneToMany,
    CreateDateColumn,
    UpdateDateColumn,
    Index,
} from "typeorm"
import { OrderItem } from "./OrderItem"
import type { OrderStatus } from "./shopTypes"

@Entity("orders")
export class Order {
    @PrimaryGeneratedColumn("uuid")
    id: string

    @Index({ unique: true })
    @Column({ type: "varchar", length: 32 })
    orderNumber: string

    /** UUID từ Auth JWT — không FK sang Auth DB */
    @Index()
    @Column({ type: "varchar", length: 36 })
    userId: string

    @Column({ type: "varchar", length: 32, default: "pending_payment" })
    status: OrderStatus

    /** Tổng tiền VND (integer) */
    @Column({ type: "int" })
    totalAmount: number

    @OneToMany(() => OrderItem, (item) => item.order, { cascade: true })
    items: OrderItem[]

    @CreateDateColumn({ type: "datetime" })
    createdAt: Date

    @UpdateDateColumn({ type: "datetime" })
    updatedAt: Date
}
