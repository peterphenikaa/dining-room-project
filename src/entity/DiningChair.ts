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

    @ManyToOne(() => DiningTable, (table) => table.chairs, { onDelete: "CASCADE" })
    diningTable: DiningTable
}
