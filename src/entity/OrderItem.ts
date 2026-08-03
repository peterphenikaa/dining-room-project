import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    CreateDateColumn,
    JoinColumn,
} from "typeorm"
import { Order } from "./Order"
import type { ShopProductType } from "./shopTypes"

@Entity("order_items")
export class OrderItem {
    @PrimaryGeneratedColumn("uuid")
    id: string

    @Column({ type: "varchar", length: 36 })
    orderId: string

    @ManyToOne(() => Order, (order) => order.items, { onDelete: "CASCADE" })
    @JoinColumn({ name: "orderId" })
    order: Order

    @Column({ type: "varchar", length: 32 })
    productType: ShopProductType

    @Column({ type: "varchar", length: 36 })
    productId: string

    /** Snapshot tên lúc checkout */
    @Column({ type: "varchar", length: 255 })
    productName: string

    /** Snapshot đơn giá VND lúc checkout */
    @Column({ type: "int" })
    unitPrice: number

    @Column({ type: "int" })
    quantity: number

    @Column({ type: "int" })
    lineTotal: number

    @CreateDateColumn({ type: "datetime" })
    createdAt: Date
}
