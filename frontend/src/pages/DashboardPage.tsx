import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { refresh } from "../api/auth";
import { fetchRooms } from "../api/rooms";
import type { DiningRoom } from "../types/api";

export function DashboardPage() {
    const { user, logout } = useAuth();
    const [rooms, setRooms] = useState<DiningRoom[] | null>(null);
    const [roomsError, setRoomsError] = useState<string | null>(null);
    const [loadingRooms, setLoadingRooms] = useState(false);
    const [refreshMsg, setRefreshMsg] = useState<string | null>(null);

    async function handleLoadRooms() {
        setLoadingRooms(true);
        setRoomsError(null);
        try {
            const data = await fetchRooms();
            setRooms(data);
        } catch {
            setRoomsError("Không tải được danh sách phòng ăn");
            setRooms(null);
        } finally {
            setLoadingRooms(false);
        }
    }

    async function handleManualRefresh() {
        setRefreshMsg(null);
        try {
            const u = await refresh();
            setRefreshMsg(`Refresh OK — ${u.email} (${u.role})`);
        } catch {
            setRefreshMsg("Refresh thất bại — cần đăng nhập lại");
        }
    }

    return (
        <div className="card">
            <header className="header">
                <div>
                    <h1>Dashboard</h1>
                    <p className="muted">Phase 2 — B4 SPA + cookie auth</p>
                </div>
                <button type="button" className="secondary" onClick={() => logout()}>
                    Đăng xuất
                </button>
            </header>

            <section className="panel">
                <h2>Phiên hiện tại</h2>
                <ul className="info-list">
                    <li>
                        <strong>Email:</strong> {user?.email}
                    </li>
                    <li>
                        <strong>Role:</strong>{" "}
                        <span className={`badge badge-${user?.role}`}>{user?.role}</span>
                    </li>
                </ul>
            </section>

            <section className="panel">
                <h2>Kiểm tra API (cookie + interceptor)</h2>
                <div className="actions">
                    <button type="button" onClick={handleLoadRooms} disabled={loadingRooms}>
                        {loadingRooms ? "Đang tải..." : "GET /api/rooms"}
                    </button>
                    <button type="button" className="secondary" onClick={handleManualRefresh}>
                        POST /api/auth/refresh
                    </button>
                </div>
                {refreshMsg && <p className="hint">{refreshMsg}</p>}
                {roomsError && <p className="error">{roomsError}</p>}
                {rooms && (
                    <p className="hint">
                        {rooms.length === 0
                            ? "Chưa có phòng ăn nào trong DB."
                            : `Đã tải ${rooms.length} phòng ăn (cookie auth OK).`}
                    </p>
                )}
            </section>

            {user?.role === "user" && (
                <p className="hint">
                    Role <code>user</code>: chỉ GET dining API. POST/PUT/DELETE sẽ 403 (B3).
                </p>
            )}
        </div>
    );
}
