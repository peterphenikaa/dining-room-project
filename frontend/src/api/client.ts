import axios, { AxiosError, type InternalAxiosRequestConfig } from "axios";
import { resolveApiUrl } from "../utils/apiUrl";

export const api = axios.create({
    baseURL: resolveApiUrl(),
    withCredentials: true,
});

type RetryConfig = InternalAxiosRequestConfig & { _retry?: boolean };

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
