import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    JoinColumn,
    CreateDateColumn,
    Index,
    Unique,
} from "typeorm";
import { User } from "./User";

export type AuthProvider = "google";

@Entity("auth_identities")
@Unique("UQ_auth_identities_provider_subject", ["provider", "providerSubject"])
@Unique("UQ_auth_identities_user_provider", ["userId", "provider"])
export class AuthIdentity {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Index("IDX_auth_identities_userId")
    @Column({ type: "varchar", length: 36 })
    userId: string;

    @ManyToOne(() => User, { onDelete: "CASCADE" })
    @JoinColumn({ name: "userId" })
    user: User;

    @Column({ type: "varchar", length: 32 })
    provider: AuthProvider;

    @Column({ type: "varchar", length: 255 })
    providerSubject: string;

    @Column({ type: "varchar", length: 255, nullable: true })
    email: string | null;

    @CreateDateColumn({ type: "datetime" })
    createdAt: Date;
}
