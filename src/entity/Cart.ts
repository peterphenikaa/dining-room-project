import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    OneToMany,
    CreateDateColumn,
    UpdateDateColumn,
    Index,
} from "typeorm"
import { CartItem } from "./CartItem"

@Entity("carts")
export class Cart {
    @PrimaryGeneratedColumn("uuid")
    id: string

    /** UUID từ Auth JWT — không FK sang Auth DB */
    @Index({ unique: true })
    @Column({ type: "varchar", length: 36 })
    userId: string

    @OneToMany(() => CartItem, (item) => item.cart, { cascade: true })
    items: CartItem[]

    @CreateDateColumn({ type: "datetime" })
    createdAt: Date

    @UpdateDateColumn({ type: "datetime" })
    updatedAt: Date
}
