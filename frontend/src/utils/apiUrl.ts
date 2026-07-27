/** Base URL API: dev → :3002; production (nginx Docker) → same-origin. */
export function resolveApiUrl(): string {
    if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL as string;
    if (import.meta.env.DEV) return "http://localhost:3002";
    return "";
}
