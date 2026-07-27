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

    /** Số lượng tủ cùng loại trong phòng */
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

    @ManyToOne(() => DiningRoom, (room) => room.cabinets, { onDelete: "CASCADE" })
    diningRoom: DiningRoom
}
