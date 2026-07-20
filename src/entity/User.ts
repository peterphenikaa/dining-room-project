import { Entity, PrimaryGeneratedColumn, Column } from "typeorm"

export type UserRole = "admin" | "user"

@Entity("users")
export class User {
    @PrimaryGeneratedColumn("uuid")
    id: string

    @Column({ unique: true })
    email: string

    @Column()
    passwordHash: string

    @Column({ type: "varchar", length: 20, default: "user" })
    role: UserRole
}
