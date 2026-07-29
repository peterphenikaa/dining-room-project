import { type FormEvent, useEffect, useState } from "react";
import * as usersApi from "../api/users";
import { useAuth } from "../context/AuthContext";
import type { UserProfile } from "../types/api";
import { getApiErrorMessage } from "../utils/apiError";

export function ProfilePage() {
    const { refreshUser } = useAuth();
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [email, setEmail] = useState("");
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [ok, setOk] = useState<string | null>(null);

    useEffect(() => {
        usersApi
            .fetchMyProfile()
            .then((p) => {
                setProfile(p);
                setEmail(p.email);
            })
            .catch((e) => setError(getApiErrorMessage(e, "Không tải được hồ sơ")))
            .finally(() => setLoading(false));
    }, []);

    async function handleSubmit(e: FormEvent) {
        e.preventDefault();
        setError(null);
        setOk(null);
        setSaving(true);
        try {
            const body: {
                email?: string;
                currentPassword?: string;
                newPassword?: string;
            } = {};
            if (email.trim() && email.trim() !== profile?.email) body.email = email.trim();
            if (newPassword) {
                if (profile?.hasPassword) body.currentPassword = currentPassword;
                body.newPassword = newPassword;
            }
            if (!body.email && !body.newPassword) {
                setError("Không có thay đổi nào");
                return;
            }
            const updated = await usersApi.updateMyProfile(body);
            setProfile(updated);
            setEmail(updated.email);
            setCurrentPassword("");
            setNewPassword("");
            await refreshUser();
            setOk("Đã cập nhật hồ sơ");
        } catch (err) {
            setError(getApiErrorMessage(err, "Không cập nhật được"));
        } finally {
            setSaving(false);
        }
    }

    if (loading) return <p className="muted">Đang tải hồ sơ...</p>;
    if (!profile) return <p className="error">{error || "Không có dữ liệu"}</p>;

    const google = profile.identities.find((i) => i.provider === "google") || null;

    return (
        <div className="page">
            <header className="page-header">
                <div>
                    <h1>Hồ sơ của tôi</h1>
                    <p className="muted">Xem và cập nhật thông tin tài khoản</p>
                </div>
            </header>

            <div className="crud-grid">
                <section className="panel-box">
                    <h2>Thông tin</h2>
                    <dl className="profile-dl">
                        <div>
                            <dt>Email</dt>
                            <dd>{profile.email}</dd>
                        </div>
                        <div>
                            <dt>Role</dt>
                            <dd>
                                <span className={`badge badge-${profile.role}`}>{profile.role}</span>
                            </dd>
                        </div>
                        <div>
                            <dt>Mật khẩu</dt>
                            <dd>{profile.hasPassword ? "Đã đặt" : "Chưa có"}</dd>
                        </div>
                    </dl>

                    <h2>Đăng nhập liên kết</h2>
                    {profile.identities.length === 0 ? (
                        <p className="muted">Chưa liên kết Google</p>
                    ) : (
                        <ul className="identity-list">
                            {profile.identities.map((i) => (
                                <li key={i.id} className="identity-item">
                                    {i.avatarUrl ? (
                                        <img
                                            src={i.avatarUrl}
                                            alt=""
                                            className="identity-avatar"
                                            referrerPolicy="no-referrer"
                                        />
                                    ) : (
                                        <span className="identity-avatar placeholder">G</span>
                                    )}
                                    <div className="identity-meta">
                                        <strong>{i.displayName || i.email || i.provider}</strong>
                                        <span className="muted">{i.provider}</span>
                                        {i.email && <span className="muted">{i.email}</span>}
                                        {(i.givenName || i.familyName) && (
                                            <span className="muted">
                                                {[i.givenName, i.familyName].filter(Boolean).join(" ")}
                                            </span>
                                        )}
                                        {i.locale && <span className="muted">Locale: {i.locale}</span>}
                                        <span className="muted">
                                            {new Date(i.createdAt).toLocaleString("vi-VN")}
                                        </span>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                    {google && !google.displayName && !google.avatarUrl && (
                        <p className="hint">Đăng xuất rồi đăng nhập Google lại để đồng bộ tên/ảnh.</p>
                    )}
                </section>

                <section className="panel-box">
                    <h2>Cập nhật</h2>
                    <p className="hint">
                        Email/mật khẩu dùng để đăng nhập app. Nếu login bằng Google thì vẫn là
                        cùng tài khoản Google đã liên kết.
                    </p>
                    <form className="form" onSubmit={handleSubmit}>
                        <label>
                            Email
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </label>
                        {profile.hasPassword ? (
                            <>
                                <label>
                                    Mật khẩu hiện tại
                                    <input
                                        type="password"
                                        value={currentPassword}
                                        onChange={(e) => setCurrentPassword(e.target.value)}
                                        autoComplete="current-password"
                                    />
                                </label>
                                <label>
                                    Mật khẩu mới
                                    <input
                                        type="password"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        minLength={8}
                                        autoComplete="new-password"
                                    />
                                </label>
                            </>
                        ) : (
                            <label>
                                Đặt mật khẩu
                                <input
                                    type="password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    minLength={8}
                                    autoComplete="new-password"
                                    placeholder="Ít nhất 8 ký tự"
                                />
                            </label>
                        )}
                        {error && <p className="error">{error}</p>}
                        {ok && <p className="ok">{ok}</p>}
                        <button type="submit" disabled={saving}>
                            {saving ? "Đang lưu..." : "Lưu thay đổi"}
                        </button>
                    </form>
                </section>
            </div>
        </div>
    );
}
