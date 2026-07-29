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

    @ManyToOne(() => DiningRoom, (room) => room.tables, { onDelete: "CASCADE" })
    diningRoom: DiningRoom

    @OneToMany(() => DiningChair, (chair) => chair.diningTable)
    chairs: DiningChair[]

    @OneToMany(() => DiningAccessory, (accessory) => accessory.diningTable)
    accessories: DiningAccessory[]
}
