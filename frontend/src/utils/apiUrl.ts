/**
 * Base URL API.
 * - Có VITE_API_URL → dùng trực tiếp
 * - Để trống → same-origin (Vite proxy `/api` + `/socket.io` → :3002)
 */
export function resolveApiUrl(): string {
    const configured = import.meta.env.VITE_API_URL as string | undefined;
    if (configured !== undefined && configured !== "") return configured;
    return "";
}
