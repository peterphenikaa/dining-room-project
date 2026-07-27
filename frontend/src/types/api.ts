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

export type CursorPage<T> = {
    items: T[];
    nextCursor: string | null;
    hasMore: boolean;
};

export type ListQuery = {
    cursor?: string | null;
    limit?: number;
};

export type DiningRoom = {
    id: string;
    name: string;
    area_size: number;
    style?: string | null;
    imageUrl?: string | null;
    imageThumbUrl?: string | null;
};

export type DiningTable = {
    id: string;
    name: string;
    material: string;
    shape: string;
    dimensions?: string | null;
    quantity: number;
    diningRoom?: DiningRoom | null;
    diningRoomId?: string;
    imageUrl?: string | null;
    imageThumbUrl?: string | null;
};

export type DiningCabinet = {
    id: string;
    name: string;
    material: string;
    dimensions?: string | null;
    quantity: number;
    diningRoom?: DiningRoom | null;
    diningRoomId?: string;
    imageUrl?: string | null;
    imageThumbUrl?: string | null;
};

export type DiningChair = {
    id: string;
    name: string;
    material: string;
    color?: string | null;
    quantity: number;
    diningTable?: DiningTable | null;
    diningTableId?: string;
    imageUrl?: string | null;
    imageThumbUrl?: string | null;
};

export type DiningAccessory = {
    id: string;
    name: string;
    type: string;
    quantity: number;
    diningTable?: DiningTable | null;
    diningTableId?: string;
    imageUrl?: string | null;
    imageThumbUrl?: string | null;
};
