import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const LINKS = [
    { to: "/rooms", title: "Phòng ăn", desc: "Quản lý phòng ăn" },
    { to: "/tables", title: "Bàn ăn", desc: "Quản lý bàn ăn" },
    { to: "/cabinets", title: "Tủ", desc: "Quản lý tủ" },
    { to: "/chairs", title: "Ghế", desc: "Quản lý ghế" },
    { to: "/accessories", title: "Phụ kiện", desc: "Quản lý phụ kiện" },
];

export function DashboardPage() {
    const { user } = useAuth();

    return (
        <div className="page">
            <header className="page-header">
                <div>
                    <h1>Tổng quan</h1>
                    <p className="muted">
                        Xin chào {user?.email} — role{" "}
                        <span className={`badge badge-${user?.role}`}>{user?.role}</span>
                    </p>
                </div>
            </header>

            <div className="link-grid">
                {LINKS.map((item) => (
                    <Link key={item.to} to={item.to} className="link-card">
                        <strong>{item.title}</strong>
                        <span className="muted">{item.desc}</span>
                    </Link>
                ))}
            </div>
        </div>
    );
}
