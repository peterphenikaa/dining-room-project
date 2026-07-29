import { type FormEvent, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { getGoogleLoginUrl } from "../api/auth";
import { GoogleIcon } from "../components/GoogleIcon";
import { useAuth } from "../context/AuthContext";
import { getApiErrorMessage } from "../utils/apiError";

export function RegisterPage() {
    const { user, register } = useAuth();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);

    if (user) {
        return <Navigate to="/" replace />;
    }

    async function handleSubmit(e: FormEvent) {
        e.preventDefault();
        setError(null);
        setSubmitting(true);
        try {
            await register(email, password, confirmPassword);
        } catch (err) {
            setError(getApiErrorMessage(err, "Không đăng ký được"));
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <div className="card">
            <h1>Đăng ký</h1>
            <p className="hint">Tạo tài khoản mới (role mặc định: user). Mật khẩu tối thiểu 8 ký tự.</p>

            <form onSubmit={handleSubmit} className="form">
                <label>
                    Email
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        autoComplete="email"
                        required
                    />
                </label>
                <label>
                    Mật khẩu
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        autoComplete="new-password"
                        minLength={8}
                        required
                    />
                </label>
                <label>
                    Xác nhận mật khẩu
                    <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        autoComplete="new-password"
                        minLength={8}
                        required
                    />
                </label>
                {error && <p className="error">{error}</p>}
                <button type="submit" disabled={submitting}>
                    {submitting ? "Đang đăng ký..." : "Đăng ký"}
                </button>
            </form>

            <div className="auth-divider">
                <span>hoặc</span>
            </div>

            <a className="btn-google" href={getGoogleLoginUrl()}>
                <GoogleIcon />
                Đăng ký / Đăng nhập với Google
            </a>

            <p className="auth-switch">
                Đã có tài khoản? <Link to="/login">Đăng nhập</Link>
            </p>
        </div>
    );
}
