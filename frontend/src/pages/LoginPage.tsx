import { type FormEvent, useEffect, useState } from "react";
import { Link, Navigate, useSearchParams } from "react-router-dom";
import { getGoogleLoginUrl } from "../api/auth";
import { GoogleIcon } from "../components/GoogleIcon";
import { useAuth } from "../context/AuthContext";
import { getApiErrorMessage } from "../utils/apiError";

export function LoginPage() {
    const { user, login } = useAuth();
    const [searchParams] = useSearchParams();
    const [email, setEmail] = useState("admin@demo.com");
    const [password, setPassword] = useState("demo");
    const [error, setError] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        const oauthError = searchParams.get("error");
        if (oauthError) setError(oauthError);
    }, [searchParams]);

    if (user) {
        return <Navigate to="/" replace />;
    }

    async function handleSubmit(e: FormEvent) {
        e.preventDefault();
        setError(null);
        setSubmitting(true);
        try {
            await login(email, password);
        } catch (err) {
            setError(getApiErrorMessage(err, "Email hoặc mật khẩu không đúng"));
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <div className="card">
            <h1>Đăng nhập</h1>

            <form onSubmit={handleSubmit} className="form">
                <label>
                    Email
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                </label>
                <label>
                    Mật khẩu
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                </label>
                {error && <p className="error">{error}</p>}
                <button type="submit" disabled={submitting}>
                    {submitting ? "Đang đăng nhập..." : "Đăng nhập"}
                </button>
            </form>

            <div className="auth-divider">
                <span>hoặc</span>
            </div>

            <a className="btn-google" href={getGoogleLoginUrl()}>
                <GoogleIcon />
                Đăng nhập với Google
            </a>

            <p className="hint">
                Demo: <code>admin@demo.com</code> / <code>user@demo.com</code> — mật khẩu{" "}
                <code>demo</code>
            </p>

            <p className="auth-switch">
                Chưa có tài khoản? <Link to="/register">Đăng ký</Link>
            </p>
        </div>
    );
}
