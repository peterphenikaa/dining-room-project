import { api } from "./client"
import type {
    ApiSuccess,
    CartView,
    ShopProductType,
} from "../types/api"

export type AddCartItemInput = {
    productType: ShopProductType
    productId: string
    quantity?: number
}

export async function fetchCart() {
    const { data } = await api.get<ApiSuccess<CartView>>("/api/cart")
    return data.data
}

export async function addCartItem(body: AddCartItemInput) {
    const { data } = await api.post<ApiSuccess<CartView>>("/api/cart/items", body)
    return data.data
}

export async function updateCartItem(id: string, quantity: number) {
    const { data } = await api.put<ApiSuccess<CartView>>(`/api/cart/items/${id}`, {
        quantity,
    })
    return data.data
}

export async function removeCartItem(id: string) {
    const { data } = await api.delete<ApiSuccess<CartView>>(`/api/cart/items/${id}`)
    return data.data
}

export async function clearCart() {
    const { data } = await api.delete<ApiSuccess<CartView>>("/api/cart")
    return data.data
}
