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

    @ManyToOne(() => DiningTable, (table) => table.accessories, { onDelete: "CASCADE" })
    diningTable: DiningTable
}
