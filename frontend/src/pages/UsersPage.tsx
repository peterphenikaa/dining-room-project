import { type FormEvent, useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import * as usersApi from "../api/users";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { RowActions } from "../components/RowActions";
import { useAuth } from "../context/AuthContext";
import type { UserProfile, UserRole } from "../types/api";
import { getApiErrorMessage } from "../utils/apiError";

const emptyEdit = {
    email: "",
    role: "user" as UserRole,
    newPassword: "",
};

export function UsersPage() {
    const { user } = useAuth();
    const [items, setItems] = useState<UserProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [form, setForm] = useState(emptyEdit);
    const [saving, setSaving] = useState(false);
    const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
    const [deleting, setDeleting] = useState(false);
    const isAdmin = user?.role === "admin";

    async function load() {
        setLoading(true);
        setError(null);
        try {
            setItems(await usersApi.fetchUsers());
        } catch (e) {
            setError(getApiErrorMessage(e, "Không tải được danh sách user"));
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        if (!isAdmin) return;
        void load();
    }, [isAdmin]);

    if (!isAdmin) {
        return <Navigate to="/" replace />;
    }

    function startEdit(row: UserProfile) {
        setEditingId(row.id);
        setForm({
            email: row.email,
            role: row.role,
            newPassword: "",
        });
    }

    function cancelEdit() {
        setEditingId(null);
        setForm(emptyEdit);
    }

    async function handleSubmit(e: FormEvent) {
        e.preventDefault();
        if (!editingId) return;
        setSaving(true);
        setError(null);
        try {
            const body: { email?: string; role?: UserRole; newPassword?: string } = {
                email: form.email.trim(),
                role: form.role,
            };
            if (form.newPassword) body.newPassword = form.newPassword;
            await usersApi.updateUser(editingId, body);
            cancelEdit();
            await load();
        } catch (err) {
            setError(getApiErrorMessage(err, "Không cập nhật được"));
        } finally {
            setSaving(false);
        }
    }

    async function confirmDelete() {
        if (!pendingDeleteId) return;
        setDeleting(true);
        try {
            await usersApi.deleteUser(pendingDeleteId);
            setPendingDeleteId(null);
            if (editingId === pendingDeleteId) cancelEdit();
            await load();
        } catch (err) {
            setError(getApiErrorMessage(err, "Không xóa được"));
            setPendingDeleteId(null);
        } finally {
            setDeleting(false);
        }
    }

    const editing = items.find((u) => u.id === editingId) || null;

    return (
        <div className="page">
            <header className="page-header">
                <div>
                    <h1>Người dùng</h1>
                    <p className="muted">Quản lý tài khoản hệ thống (admin)</p>
                </div>
            </header>

            {error && <p className="error">{error}</p>}
            {loading && <p className="muted">Đang tải...</p>}

            <div className="crud-grid">
                <section className="panel-box">
                    <h2>Danh sách ({items.length})</h2>
                    <div className="table-wrap">
                        <table>
                            <thead>
                                <tr>
                                    <th>Email</th>
                                    <th>Role</th>
                                    <th>MK</th>
                                    <th>Liên kết</th>
                                    <th></th>
                                </tr>
                            </thead>
                            <tbody>
                                {items.map((row) => (
                                    <tr key={row.id}>
                                        <td>{row.email}</td>
                                        <td>
                                            <span className={`badge badge-${row.role}`}>{row.role}</span>
                                        </td>
                                        <td>{row.hasPassword ? "Có" : "—"}</td>
                                        <td>
                                            {row.identities.map((i) => i.provider).join(", ") || "—"}
                                        </td>
                                        <RowActions
                                            onEdit={() => startEdit(row)}
                                            onDelete={() => setPendingDeleteId(row.id)}
                                        />
                                    </tr>
                                ))}
                                {!loading && items.length === 0 && (
                                    <tr>
                                        <td colSpan={5}>Chưa có user</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </section>

                <section className="panel-box">
                    <h2>{editing ? "Sửa user" : "Chi tiết"}</h2>
                    {!editing ? (
                        <p className="hint">Chọn Sửa trên một user để chỉnh email / role / mật khẩu.</p>
                    ) : (
                        <form className="form" onSubmit={handleSubmit}>
                            <p className="muted">
                                ID: <code>{editing.id}</code>
                            </p>
                            <label>
                                Email
                                <input
                                    type="email"
                                    value={form.email}
                                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                                    required
                                />
                            </label>
                            <label>
                                Role
                                <select
                                    value={form.role}
                                    onChange={(e) =>
                                        setForm({ ...form, role: e.target.value as UserRole })
                                    }
                                >
                                    <option value="user">user</option>
                                    <option value="admin">admin</option>
                                </select>
                            </label>
                            <label>
                                Mật khẩu mới (tuỳ chọn)
                                <input
                                    type="password"
                                    value={form.newPassword}
                                    onChange={(e) => setForm({ ...form, newPassword: e.target.value })}
                                    minLength={8}
                                    placeholder="Để trống nếu không đổi"
                                />
                            </label>
                            <div>
                                <p className="muted">Liên kết:</p>
                                {editing.identities.length === 0 ? (
                                    <p className="muted">Không có</p>
                                ) : (
                                    <ul className="identity-list">
                                        {editing.identities.map((i) => (
                                            <li key={i.id} className="identity-item">
                                                {i.avatarUrl ? (
                                                    <img
                                                        src={i.avatarUrl}
                                                        alt=""
                                                        className="identity-avatar"
                                                        referrerPolicy="no-referrer"
                                                    />
                                                ) : null}
                                                <div className="identity-meta">
                                                    <strong>{i.displayName || i.provider}</strong>
                                                    <span className="muted">
                                                        {i.email || i.providerSubject}
                                                    </span>
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                            <div className="actions">
                                <button type="submit" disabled={saving}>
                                    {saving ? "Đang lưu..." : "Cập nhật"}
                                </button>
                                <button type="button" className="secondary" onClick={cancelEdit}>
                                    Hủy
                                </button>
                            </div>
                        </form>
                    )}
                </section>
            </div>

            <ConfirmDialog
                open={!!pendingDeleteId}
                title="Xóa người dùng"
                message="Xóa user này sẽ xóa luôn identity liên kết. Tiếp tục?"
                busy={deleting}
                onCancel={() => setPendingDeleteId(null)}
                onConfirm={() => void confirmDelete()}
            />
        </div>
    );
}
