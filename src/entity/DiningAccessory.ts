import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from "typeorm"
import { DiningTable } from "./DiningTable"

@Entity()
export class DiningAccessory {
    @PrimaryGeneratedColumn("uuid")
    id: string

    @Column()
    name: string

    @Column()
    type: string

    /** Số lượng phụ kiện cùng loại gắn với bàn */
    @Column({ type: "int", default: 1 })
    quantity: number

    @ManyToOne(() => DiningTable, (table) => table.accessories, { onDelete: "CASCADE" })
    diningTable: DiningTable
}
