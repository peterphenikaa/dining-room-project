import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
    type ReactNode,
} from "react";
import { io } from "socket.io-client";
import { useAuth } from "./AuthContext";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3002";

export type DiningChangedEvent = {
    entityType: "room" | "table" | "cabinet" | "chair" | "accessory";
    action: "create" | "update" | "delete";
    entityId: string | null;
    actorId: string;
    actorEmail: string;
    message: string;
};

type SocketContextValue = {
    connected: boolean;
    lastEvent: DiningChangedEvent | null;
    clearLastEvent: () => void;
};

const SocketContext = createContext<SocketContextValue | null>(null);

export function SocketProvider({ children }: { children: ReactNode }) {
    const { user } = useAuth();
    const [connected, setConnected] = useState(false);
    const [lastEvent, setLastEvent] = useState<DiningChangedEvent | null>(null);

    const clearLastEvent = useCallback(() => setLastEvent(null), []);

    useEffect(() => {
        if (!user) {
            setConnected(false);
            return;
        }

        const s = io(API_URL, {
            withCredentials: true,
            transports: ["websocket", "polling"],
        });

        s.on("connect", () => setConnected(true));
        s.on("disconnect", () => setConnected(false));
        s.on("dining:changed", (payload: DiningChangedEvent) => {
            setLastEvent(payload);
        });

        return () => {
            s.disconnect();
        };
    }, [user?.id]);

    const value = useMemo(
        () => ({ connected, lastEvent, clearLastEvent }),
        [connected, lastEvent, clearLastEvent]
    );

    return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
}

export function useSocket() {
    const ctx = useContext(SocketContext);
    if (!ctx) {
        throw new Error("useSocket phải dùng trong SocketProvider");
    }
    return ctx;
}
