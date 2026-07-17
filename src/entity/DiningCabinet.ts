import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from "typeorm"
import { DiningRoom } from "./DiningRoom"

@Entity()
export class DiningCabinet {
    @PrimaryGeneratedColumn("uuid")
    id: string

    @Column()
    name: string

    @Column()
    material: string

    @Column({ nullable: true })
    dimensions: string 

    @ManyToOne(() => DiningRoom, (room) => room.cabinets, { onDelete: "CASCADE" })
    diningRoom: DiningRoom
}
