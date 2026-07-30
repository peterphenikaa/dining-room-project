import { Server as HttpServer } from "http";
import { Server, Socket } from "socket.io";
import { ACCESS_COOKIE, type AuthUser, verifyAccessToken } from "../security";

export type DiningEntityType = "room" | "table" | "cabinet" | "chair" | "accessory";
export type DiningAction = "create" | "update" | "delete";

export type DiningChangedPayload = {
    entityType: DiningEntityType;
    action: DiningAction;
    entityId: string | null;
    actorId: string;
    actorEmail: string;
    message: string;
};

const DINING_ROOM = "dining";

let io: Server | null = null;

function parseCookies(header?: string): Record<string, string> {
    if (!header) return {};
    const out: Record<string, string> = {};
    for (const part of header.split(";")) {
        const idx = part.indexOf("=");
        if (idx === -1) continue;
        const key = part.slice(0, idx).trim();
        const value = decodeURIComponent(part.slice(idx + 1).trim());
        out[key] = value;
    }
    return out;
}

function authenticateSocket(socket: Socket): AuthUser {
    const cookies = parseCookies(socket.handshake.headers.cookie);
    const token = cookies[ACCESS_COOKIE];
    if (!token) {
        throw new Error("Thiếu access token");
    }
    return verifyAccessToken(token);
}

export function initIO(httpServer: HttpServer, corsOrigin: string | string[]): Server {
    io = new Server(httpServer, {
        cors: {
            origin: corsOrigin,
            credentials: true,
        },
    });

    io.use((socket: Socket, next: (err?: Error) => void) => {
        try {
            socket.data.user = authenticateSocket(socket);
            next();
        } catch {
            next(new Error("Unauthorized"));
        }
    });

    io.on("connection", (socket: Socket) => {
        const user = socket.data.user as AuthUser;
        socket.join(DINING_ROOM);
        console.log(`[socket] connected: ${user.email} (${socket.id})`);

        socket.on("disconnect", () => {
            console.log(`[socket] disconnected: ${user.email} (${socket.id})`);
        });
    });

    return io;
}

export function getIO(): Server {
    if (!io) {
        throw new Error("Socket.IO chưa được khởi tạo");
    }
    return io;
}

const ENTITY_LABEL: Record<DiningEntityType, string> = {
    room: "phòng ăn",
    table: "bàn ăn",
    cabinet: "tủ",
    chair: "ghế",
    accessory: "phụ kiện",
};

const ACTION_LABEL: Record<DiningAction, string> = {
    create: "tạo",
    update: "cập nhật",
    delete: "xóa",
};

export function emitDiningChanged(input: {
    entityType: DiningEntityType;
    action: DiningAction;
    entityId?: string | null;
    actorId: string;
    actorEmail: string;
}) {
    if (!io) return;

    const payload: DiningChangedPayload = {
        entityType: input.entityType,
        action: input.action,
        entityId: input.entityId ?? null,
        actorId: input.actorId,
        actorEmail: input.actorEmail,
        message: `${input.actorEmail} vừa ${ACTION_LABEL[input.action]} ${ENTITY_LABEL[input.entityType]}`,
    };

    io.to(DINING_ROOM).emit("dining:changed", payload);
}
