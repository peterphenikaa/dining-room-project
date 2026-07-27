import { useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { useSocket, type DiningChangedEvent } from "../context/SocketContext";


export function useReloadOnDiningChange(
    entityType: DiningChangedEvent["entityType"],
    reload: () => void | Promise<void>
) {
    const { lastEvent } = useSocket();
    const { user } = useAuth();
    const reloadRef = useRef(reload);
    reloadRef.current = reload;

    useEffect(() => {
        if (!lastEvent) return;
        if (lastEvent.entityType !== entityType) return;
        if (user?.id && lastEvent.actorId === user.id) return;
        void reloadRef.current();
    }, [lastEvent, entityType, user?.id]);
}
