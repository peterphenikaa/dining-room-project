import axios, { AxiosError, type InternalAxiosRequestConfig } from "axios";
import { resolveApiUrl } from "../utils/apiUrl";

/**
 * Axios client dùng httpOnly cookie (B2/B2b).
 * withCredentials: true — browser tự gửi access_token + refresh_token.
 */
export const api = axios.create({
    baseURL: resolveApiUrl(),
    withCredentials: true,
});


type RetryConfig = InternalAxiosRequestConfig & { _retry?: boolean };

/** Chỉ 1 request refresh đồng thời; các request 401 khác chờ chung promise này */
let refreshPromise: Promise<void> | null = null;

function shouldSkipRefresh(url?: string): boolean {
    if (!url) return false;
    return (
        url.includes("/api/auth/login") ||
        url.includes("/api/auth/register") ||
        url.includes("/api/auth/refresh") ||
        url.includes("/api/auth/logout")
    );
}

async function refreshSession(): Promise<void> {
    if (!refreshPromise) {
        refreshPromise = api
            .post("/api/auth/refresh")
            .then(() => undefined)
            .finally(() => {
                refreshPromise = null;
            });
    }
    await refreshPromise;
}

/**
 * Interceptor B4: 401 → gọi /api/auth/refresh 1 lần → retry request gốc.
 * Không retry vô hạn (_retry flag) và không refresh trên chính endpoint auth.
 */
api.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
        const config = error.config as RetryConfig | undefined;

        if (!config || error.response?.status !== 401) {
            return Promise.reject(error);
        }

        if (shouldSkipRefresh(config.url) || config._retry) {
            return Promise.reject(error);
        }

        config._retry = true;

        try {
            await refreshSession();
            return api(config);
        } catch (refreshError) {
            return Promise.reject(refreshError);
        }
    }
);
