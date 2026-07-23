import { type FormEvent, useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export function LoginPage() {
    const { user, login } = useAuth();
    const [email, setEmail] = useState("admin@demo.com");
    const [password, setPassword] = useState("demo");
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
            await login(email, password);
        } catch {
            setError("Email hoặc mật khẩu không đúng");
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <div className="card">
            <h1>Đăng nhập</h1>
            <p className="muted">Cookie httpOnly — axios withCredentials</p>

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

            <p className="hint">
                Demo: <code>admin@demo.com</code> / <code>user@demo.com</code> — mật khẩu{" "}
                <code>demo</code>
            </p>
        </div>
    );
}
