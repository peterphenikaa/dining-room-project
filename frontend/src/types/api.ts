export type UserRole = "admin" | "user";

export type AuthUser = {
    id: string;
    email: string;
    role: UserRole;
};

export type ApiSuccess<T> = {
    status: "success";
    message: string;
    data: T;
};

export type ApiError = {
    status: "error";
    statusCode: number;
    message: string;
};

export type DiningRoom = {
    id: string;
    name: string;
    area_size: number;
    style?: string | null;
};
