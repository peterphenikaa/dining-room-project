import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from "typeorm"
import { DiningTable } from "./DiningTable"
import { DiningCabinet } from "./DiningCabinet"

@Entity()
export class DiningRoom {
    @PrimaryGeneratedColumn("uuid")
    id: string

    @Column()
    name: string

    @Column("float")
    area_size: number

    @Column({ nullable: true })
    style: string

    @OneToMany(() => DiningTable, (table) => table.diningRoom)
    tables: DiningTable[]

    @OneToMany(() => DiningCabinet, (cabinet) => cabinet.diningRoom)
    cabinets: DiningCabinet[]
}
