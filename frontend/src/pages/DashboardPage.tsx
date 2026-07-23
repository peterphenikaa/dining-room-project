import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const LINKS = [
    { to: "/rooms", title: "Phòng ăn", desc: "CRUD /api/rooms" },
    { to: "/tables", title: "Bàn ăn", desc: "CRUD /api/tables + quantity" },
    { to: "/cabinets", title: "Tủ", desc: "CRUD /api/cabinets + quantity" },
    { to: "/chairs", title: "Ghế", desc: "CRUD /api/chairs + quantity" },
    { to: "/accessories", title: "Phụ kiện", desc: "CRUD /api/accessories + quantity" },
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

            <p className="hint">
                {user?.role === "admin"
                    ? "Admin: tạo / sửa / xóa đủ 5 entity."
                    : "User: chỉ xem danh sách (GET). Nút ghi bị ẩn; API ghi sẽ 403."}
            </p>

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
