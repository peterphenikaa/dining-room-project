import type { UserRole } from "../security";

export type UserCreatedEvent = {
    type: "UserCreated";
    userId: string;
    email: string;
    role: UserRole;
    source: "register" | "google";
    occurredAt: string;
};

export type UserRoleChangedEvent = {
    type: "UserRoleChanged";
    userId: string;
    email: string;
    fromRole: UserRole;
    toRole: UserRole;
    actorId: string;
    occurredAt: string;
};

export type AuthUserEvent = UserCreatedEvent | UserRoleChangedEvent;
