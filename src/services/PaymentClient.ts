import { paymentServiceConfig } from "../config/env"
import { AppError } from "../utils/AppError"

type ApiSuccess<T> = {
    status: "success"
    message: string
    data: T
}

export type PaymentDto = {
    id: string
    orderId: string
    orderNumber: string
    userId: string
    provider: string
    status: "pending" | "paid" | "cancelled"
    amount: number
    orderCode?: string | null
    providerPaymentId: string | null
    checkoutUrl: string | null
    paidAt: string | null
}

function cookieHeader(cookie?: string): HeadersInit {
    return cookie ? { Cookie: cookie, "Content-Type": "application/json" } : { "Content-Type": "application/json" }
}

async function parseJson<T>(res: Response): Promise<T> {
    const body = (await res.json().catch(() => null)) as
        | ApiSuccess<T>
        | { status: "error"; message?: string; statusCode?: number }
        | null
    if (!res.ok) {
        const msg =
            body && "message" in body && body.message
                ? body.message
                : `Payment service lỗi ${res.status}`
        throw new AppError(msg, res.status >= 400 && res.status < 600 ? res.status : 502)
    }
    if (!body || body.status !== "success") {
        throw new AppError("Payment service response không hợp lệ", 502)
    }
    return body.data
}

export class PaymentClient {
    static async createPending(
        data: {
            orderId: string
            orderNumber: string
            userId: string
            amount: number
        },
        cookie?: string,
    ): Promise<PaymentDto | null> {
        try {
            const res = await fetch(`${paymentServiceConfig.url}/api/payments`, {
                method: "POST",
                headers: cookieHeader(cookie),
                body: JSON.stringify(data),
                signal: AbortSignal.timeout(paymentServiceConfig.proxyTimeoutMs),
            })
            return await parseJson<PaymentDto>(res)
        } catch (err) {
            console.warn("[payment-client] createPending failed:", err)
            return null
        }
    }

    static async markPaidByOrder(orderId: string, cookie?: string): Promise<PaymentDto> {
        const res = await fetch(
            `${paymentServiceConfig.url}/api/payments/by-order/${orderId}/mark-paid`,
            {
                method: "POST",
                headers: cookieHeader(cookie),
                signal: AbortSignal.timeout(paymentServiceConfig.proxyTimeoutMs),
            },
        )
        return parseJson<PaymentDto>(res)
    }

    static async cancelByOrder(orderId: string, cookie?: string): Promise<PaymentDto | null> {
        try {
            const res = await fetch(
                `${paymentServiceConfig.url}/api/payments/by-order/${orderId}/cancel`,
                {
                    method: "POST",
                    headers: cookieHeader(cookie),
                    signal: AbortSignal.timeout(paymentServiceConfig.proxyTimeoutMs),
                },
            )
            if (res.status === 404) return null
            return await parseJson<PaymentDto>(res)
        } catch (err) {
            console.warn("[payment-client] cancelByOrder failed:", err)
            return null
        }
    }

    static async getByOrder(orderId: string, cookie?: string): Promise<PaymentDto | null> {
        try {
            const res = await fetch(
                `${paymentServiceConfig.url}/api/payments/by-order/${orderId}`,
                {
                    headers: cookieHeader(cookie),
                    signal: AbortSignal.timeout(paymentServiceConfig.proxyTimeoutMs),
                },
            )
            if (res.status === 404) return null
            return await parseJson<PaymentDto>(res)
        } catch {
            return null
        }
    }

    static async createPayosCheckoutByOrder(
        orderId: string,
        cookie?: string,
    ): Promise<PaymentDto> {
        const res = await fetch(
            `${paymentServiceConfig.url}/api/payments/by-order/${orderId}/payos/checkout`,
            {
                method: "POST",
                headers: cookieHeader(cookie),
                signal: AbortSignal.timeout(paymentServiceConfig.proxyTimeoutMs),
            },
        )
        return parseJson<PaymentDto>(res)
    }

    static async syncPayosByOrder(orderId: string, cookie?: string): Promise<PaymentDto> {
        const res = await fetch(
            `${paymentServiceConfig.url}/api/payments/by-order/${orderId}/payos/sync`,
            {
                method: "POST",
                headers: cookieHeader(cookie),
                signal: AbortSignal.timeout(paymentServiceConfig.proxyTimeoutMs),
            },
        )
        return parseJson<PaymentDto>(res)
    }

    static async syncPayosByOrderCode(
        orderCode: number,
        cookie?: string,
    ): Promise<PaymentDto> {
        const res = await fetch(`${paymentServiceConfig.url}/api/payments/payos/sync`, {
            method: "POST",
            headers: {
                ...cookieHeader(cookie),
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ orderCode }),
            signal: AbortSignal.timeout(paymentServiceConfig.proxyTimeoutMs),
        })
        return parseJson<PaymentDto>(res)
    }
}
