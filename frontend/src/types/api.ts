export type UserRole = "admin" | "user";

export type AuthUser = {
    id: string;
    email: string;
    role: UserRole;
};

export type UserIdentity = {
    id: string;
    provider: string;
    providerSubject: string;
    email: string | null;
    displayName: string | null;
    givenName: string | null;
    familyName: string | null;
    avatarUrl: string | null;
    locale: string | null;
    createdAt: string;
};

export type UserProfile = {
    id: string;
    email: string;
    role: UserRole;
    hasPassword: boolean;
    identities: UserIdentity[];
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
    price: number;
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
    price: number;
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
    price: number;
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
    price: number;
    diningTable?: DiningTable | null;
    diningTableId?: string;
    imageUrl?: string | null;
    imageThumbUrl?: string | null;
};

export type ShopProductType = "table" | "chair" | "cabinet" | "accessory";

export type OrderStatus =
    | "pending_payment"
    | "paid"
    | "cancelled"
    | "fulfilled";

export type CartItemView = {
    id: string;
    productType: ShopProductType;
    productId: string;
    quantity: number;
    productName: string | null;
    unitPrice: number | null;
    stock: number | null;
    lineTotal: number | null;
    available: boolean;
};

export type CartView = {
    id: string;
    userId: string;
    items: CartItemView[];
    totalAmount: number;
    createdAt: string;
    updatedAt: string;
};

export type OrderItem = {
    id: string;
    productType: ShopProductType;
    productId: string;
    productName: string;
    unitPrice: number;
    quantity: number;
    lineTotal: number;
};

export type Order = {
    id: string;
    orderNumber: string;
    userId: string;
    status: OrderStatus;
    totalAmount: number;
    items?: OrderItem[];
    payment?: {
        id: string;
        status: string;
        provider: string;
        amount: number;
        checkoutUrl: string | null;
        paidAt: string | null;
        orderCode?: string | null;
    } | null;
    createdAt: string;
    updatedAt: string;
};
