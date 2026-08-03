/** SKU bán được — Room không bán */
export type ShopProductType = "table" | "chair" | "cabinet" | "accessory"

export const SHOP_PRODUCT_TYPES: ShopProductType[] = [
    "table",
    "chair",
    "cabinet",
    "accessory",
]

export type OrderStatus =
    | "pending_payment"
    | "paid"
    | "cancelled"
    | "fulfilled"

export const ORDER_STATUSES: OrderStatus[] = [
    "pending_payment",
    "paid",
    "cancelled",
    "fulfilled",
]
