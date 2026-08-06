import { paymentServiceConfig, payosConfig } from "../../../config/env"

export async function notifyDiningOrderPaid(orderId: string): Promise<void> {
    const url = `${payosConfig.diningInternalUrl}/api/orders/internal/mark-paid`
    try {
        const res = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-Payment-Callback-Secret": paymentServiceConfig.callbackSecret,
            },
            body: JSON.stringify({ orderId }),
            signal: AbortSignal.timeout(10_000),
        })
        if (!res.ok) {
            const text = await res.text().catch(() => "")
            console.warn(
                `[payos] notify Dining mark-paid failed status=${res.status} body=${text}`,
            )
        } else {
            console.log(`[payos] Dining order marked paid orderId=${orderId}`)
        }
    } catch (err) {
        console.warn("[payos] notify Dining mark-paid error:", err)
    }
}
