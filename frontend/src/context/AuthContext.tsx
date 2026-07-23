import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import * as authApi from "../api/auth";
import type { AuthUser } from "../types/api";

type AuthContextValue = {
    user: AuthUser | null;
    loading: boolean;
    login: (email: string, password: string) => Promise<void>;
    register: (email: string, password: string, confirmPassword: string) => Promise<void>;
    logout: () => Promise<void>;
    refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [loading, setLoading] = useState(true);

    const refreshUser = useCallback(async () => {
        const me = await authApi.getMe();
        setUser(me);
    }, []);

    useEffect(() => {
        authApi
            .getMe()
            .then(setUser)
            .catch(() => setUser(null))
            .finally(() => setLoading(false));
    }, []);

    const login = useCallback(async (email: string, password: string) => {
        const loggedIn = await authApi.login(email, password);
        setUser(loggedIn);
    }, []);

    const register = useCallback(async (email: string, password: string, confirmPassword: string) => {
        const created = await authApi.register(email, password, confirmPassword);
        setUser(created);
    }, []);

    const logout = useCallback(async () => {
        await authApi.logout();
        setUser(null);
    }, []);

    const value = useMemo(
        () => ({ user, loading, login, register, logout, refreshUser }),
        [user, loading, login, register, logout, refreshUser]
    );

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) {
        throw new Error("useAuth phải dùng trong AuthProvider");
    }
    return ctx;
}
