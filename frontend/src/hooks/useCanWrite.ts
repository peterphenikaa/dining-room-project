import { useAuth } from "../context/AuthContext";

export function useCanWrite() {
    const { user } = useAuth();
    return user?.role === "admin";
}
