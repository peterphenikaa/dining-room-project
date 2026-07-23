import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany } from "typeorm"
import { DiningRoom } from "./DiningRoom"
import { DiningChair } from "./DiningChair"
import { DiningAccessory } from "./DiningAccessory"

@Entity()
export class DiningTable {
    @PrimaryGeneratedColumn("uuid")
    id: string

    @Column()
    name: string

    @Column()
    material: string

    @Column()
    shape: string 

    @Column({ nullable: true })
    dimensions: string

    /** Số lượng bàn cùng loại trong phòng */
    @Column({ type: "int", default: 1 })
    quantity: number

    @ManyToOne(() => DiningRoom, (room) => room.tables, { onDelete: "CASCADE" })
    diningRoom: DiningRoom

    @OneToMany(() => DiningChair, (chair) => chair.diningTable)
    chairs: DiningChair[]

    @OneToMany(() => DiningAccessory, (accessory) => accessory.diningTable)
    accessories: DiningAccessory[]
}
