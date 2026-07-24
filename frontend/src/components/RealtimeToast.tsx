import { useEffect } from "react";
import { useSocket } from "../context/SocketContext";

export function RealtimeToast() {
    const { lastEvent, clearLastEvent, connected } = useSocket();

    useEffect(() => {
        if (!lastEvent) return;
        const t = window.setTimeout(() => clearLastEvent(), 4500);
        return () => window.clearTimeout(t);
    }, [lastEvent, clearLastEvent]);

    return (
        <div className="realtime-bar" aria-live="polite">
            <span className={`socket-dot ${connected ? "on" : "off"}`} title={connected ? "Socket connected" : "Socket offline"} />
            {lastEvent ? <span className="realtime-msg">{lastEvent.message}</span> : <span className="muted">Realtime sẵn sàng</span>}
        </div>
    );
}
