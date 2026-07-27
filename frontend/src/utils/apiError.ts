import { AxiosError } from "axios";
import type { ApiError } from "../types/api";

export function getApiErrorMessage(error: unknown, fallback = "Có lỗi xảy ra"): string {
    const err = error as AxiosError<ApiError>;
    if (!err.response) {
        return "Không kết nối được API. Kiểm tra backend/nginx.";
    }
    if (err.response.status === 502 || err.response.status === 503) {
        return "API tạm không phản hồi (502/503). Thử lại sau vài giây.";
    }
    return err.response.data?.message || fallback;
}
