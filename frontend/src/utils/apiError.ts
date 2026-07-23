import { AxiosError } from "axios";
import type { ApiError } from "../types/api";

export function getApiErrorMessage(error: unknown, fallback = "Có lỗi xảy ra"): string {
    const err = error as AxiosError<ApiError>;
    return err.response?.data?.message || fallback;
}
