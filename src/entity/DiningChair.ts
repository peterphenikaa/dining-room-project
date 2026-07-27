import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from "typeorm"
import { DiningTable } from "./DiningTable"

@Entity()
export class DiningChair {
    @PrimaryGeneratedColumn("uuid")
    id: string

    @Column()
    name: string

    @Column()
    material: string

    @Column({ nullable: true })
    color: string

    /** Số lượng ghế cùng loại gắn với bàn */
    @Column({ type: "int", default: 1 })
    quantity: number

    @Column({ type: "varchar", length: 500, nullable: true })
    imageUrl: string | null

    @Column({ type: "varchar", length: 500, nullable: true })
    imageKey: string | null

    @Column({ type: "varchar", length: 500, nullable: true })
    imageThumbUrl: string | null

    @Column({ type: "varchar", length: 500, nullable: true })
    imageThumbKey: string | null

    @ManyToOne(() => DiningTable, (table) => table.chairs, { onDelete: "CASCADE" })
    diningTable: DiningTable
}
