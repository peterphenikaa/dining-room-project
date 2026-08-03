import { api } from "./client"
import { toListParams } from "./listParams"
import type {
    ApiSuccess,
    CursorPage,
    ListQuery,
    Order,
} from "../types/api"

export async function checkout() {
    const { data } = await api.post<ApiSuccess<Order>>("/api/orders/checkout")
    return data.data
}

export async function fetchMyOrders(query?: ListQuery) {
    const { data } = await api.get<ApiSuccess<CursorPage<Order>>>("/api/orders/mine", {
        params: toListParams(query),
    })
    return data.data
}

export async function fetchAllOrders(query?: ListQuery) {
    const { data } = await api.get<ApiSuccess<CursorPage<Order>>>("/api/orders", {
        params: toListParams(query),
    })
    return data.data
}

export async function fetchOrderById(id: string) {
    const { data } = await api.get<ApiSuccess<Order>>(`/api/orders/${id}`)
    return data.data
}

export async function cancelOrder(id: string) {
    const { data } = await api.put<ApiSuccess<Order>>(`/api/orders/${id}/cancel`)
    return data.data
}

export async function markOrderPaid(id: string) {
    const { data } = await api.put<ApiSuccess<Order>>(`/api/orders/${id}/mark-paid`)
    return data.data
}

export type PayosCheckoutResult = {
    orderId: string
    checkoutUrl: string | null
    payment: {
        id: string
        checkoutUrl: string | null
        status: string
        provider: string
    }
}

export async function createPayosCheckout(orderId: string) {
    const { data } = await api.post<ApiSuccess<PayosCheckoutResult>>(
        `/api/orders/${orderId}/payos-checkout`,
    )
    return data.data
}

export async function syncPayosPayment(orderId: string) {
    const { data } = await api.post<ApiSuccess<Order>>(`/api/orders/${orderId}/payos-sync`)
    return data.data
}

export async function syncPayosByCode(orderCode: number) {
    const { data } = await api.post<ApiSuccess<Order>>(`/api/orders/payos-sync`, {
        orderCode,
    })
    return data.data
}
