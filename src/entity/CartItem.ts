import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    CreateDateColumn,
    UpdateDateColumn,
    Index,
    JoinColumn,
} from "typeorm"
import { Cart } from "./Cart"
import type { ShopProductType } from "./shopTypes"

@Entity("cart_items")
@Index(["cartId", "productType", "productId"], { unique: true })
export class CartItem {
    @PrimaryGeneratedColumn("uuid")
    id: string

    @Column({ type: "varchar", length: 36 })
    cartId: string

    @ManyToOne(() => Cart, (cart) => cart.items, { onDelete: "CASCADE" })
    @JoinColumn({ name: "cartId" })
    cart: Cart

    @Column({ type: "varchar", length: 32 })
    productType: ShopProductType

    @Column({ type: "varchar", length: 36 })
    productId: string

    @Column({ type: "int" })
    quantity: number

    @CreateDateColumn({ type: "datetime" })
    createdAt: Date

    @UpdateDateColumn({ type: "datetime" })
    updatedAt: Date
}
