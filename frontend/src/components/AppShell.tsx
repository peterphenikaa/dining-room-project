import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { RealtimeToast } from "./RealtimeToast";

export function AppShell() {
    const { user, logout } = useAuth();
    const isAdmin = user?.role === "admin";

    const nav = [
        { to: "/", label: "Tổng quan", end: true },
        { to: "/rooms", label: "Phòng ăn" },
        { to: "/tables", label: "Bàn ăn" },
        { to: "/cabinets", label: "Tủ" },
        { to: "/chairs", label: "Ghế" },
        { to: "/accessories", label: "Phụ kiện" },
        { to: "/profile", label: "Hồ sơ" },
        ...(isAdmin ? [{ to: "/users", label: "Người dùng" }] : []),
    ];

    return (
        <div className="shell">
            <aside className="sidebar">
                <div className="brand">
                    <strong>Phòng ăn</strong>
                    <span className="muted">Quản lý nội thất</span>
                </div>
                <nav className="nav">
                    {nav.map((item) => (
                        <NavLink
                            key={item.to}
                            to={item.to}
                            end={item.end}
                            className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}
                        >
                            {item.label}
                        </NavLink>
                    ))}
                </nav>
                <div className="sidebar-footer">
                    <div className="user-chip">
                        <span>{user?.email}</span>
                        <span className={`badge badge-${user?.role}`}>{user?.role}</span>
                    </div>
                    <button type="button" className="secondary" onClick={() => logout()}>
                        Đăng xuất
                    </button>
                </div>
            </aside>
            <div className="shell-main">
                <RealtimeToast />
                <Outlet />
            </div>
        </div>
    );
}
