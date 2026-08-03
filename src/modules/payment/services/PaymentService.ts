import { PaymentDataSource } from "../data-source"
import { Payment } from "../entity/Payment"
import { AppError } from "../../../utils/AppError"
import { payosConfig } from "../../../config/env"
import { generatePayosOrderCode, getPayOS } from "../payos/payosClient"
import { notifyDiningOrderPaid } from "../payos/notifyDining"

const repo = () => PaymentDataSource.getRepository(Payment)

export class PaymentService {
    static async createPending(data: {
        orderId: string
        orderNumber: string
        userId: string
        amount: number
    }): Promise<Payment> {
        const existing = await repo().findOneBy({ orderId: data.orderId })
        if (existing) {
            if (existing.status === "cancelled") {
                throw new AppError("Đơn đã hủy — không tạo lại payment", 400)
            }
            return existing
        }

        const payment = repo().create({
            orderId: data.orderId,
            orderNumber: data.orderNumber,
            userId: data.userId,
            provider: "manual",
            status: "pending",
            amount: data.amount,
            orderCode: null,
            providerPaymentId: null,
            checkoutUrl: null,
            paidAt: null,
        })
        return repo().save(payment)
    }

    static async getByOrderId(orderId: string): Promise<Payment | null> {
        return repo().findOneBy({ orderId })
    }

    static async getById(id: string): Promise<Payment | null> {
        return repo().findOneBy({ id })
    }

    static async getByOrderCode(orderCode: number): Promise<Payment | null> {
        return repo().findOneBy({ orderCode: String(orderCode) })
    }

    static async markPaid(id: string): Promise<Payment> {
        const payment = await repo().findOneBy({ id })
        if (!payment) throw new AppError("Không tìm thấy payment", 404)
        if (payment.status === "cancelled") {
            throw new AppError("Payment đã hủy", 400)
        }
        if (payment.status === "paid") return payment

        payment.status = "paid"
        payment.paidAt = new Date()
        return repo().save(payment)
    }

    static async markPaidByOrder(orderId: string): Promise<Payment> {
        const payment = await repo().findOneBy({ orderId })
        if (!payment) throw new AppError("Không tìm thấy payment cho đơn này", 404)
        return this.markPaid(payment.id)
    }

    static async cancelByOrder(orderId: string): Promise<Payment | null> {
        const payment = await repo().findOneBy({ orderId })
        if (!payment) return null
        if (payment.status === "paid") {
            throw new AppError("Không hủy payment đã thanh toán", 400)
        }
        if (payment.status === "cancelled") return payment
        payment.status = "cancelled"
        return repo().save(payment)
    }

    static async createPayosCheckout(paymentId: string): Promise<Payment> {
        const payment = await repo().findOneBy({ id: paymentId })
        if (!payment) throw new AppError("Không tìm thấy payment", 404)
        if (payment.status === "paid") {
            throw new AppError("Payment đã thanh toán", 400)
        }
        if (payment.status === "cancelled") {
            throw new AppError("Payment đã hủy", 400)
        }
        payment.checkoutUrl = null
        payment.providerPaymentId = null
        payment.orderCode = null

        let orderCode = 0
        for (let i = 0; i < 5; i++) {
            const candidate = generatePayosOrderCode()
            const clash = await repo().findOneBy({ orderCode: String(candidate) })
            if (!clash) {
                orderCode = candidate
                break
            }
        }
        if (!orderCode) {
            throw new AppError("Không tạo được orderCode PayOS", 500)
        }
        payment.orderCode = String(orderCode)

        const payOS = getPayOS()
        const description = payment.orderNumber.slice(0, 25)

        try {
            const link = await payOS.paymentRequests.create({
                orderCode,
                amount: payment.amount,
                description,
                returnUrl: payosConfig.returnUrl,
                cancelUrl: payosConfig.cancelUrl,
                items: [
                    {
                        name: description,
                        quantity: 1,
                        price: payment.amount,
                    },
                ],
            })

            payment.provider = "payos"
            payment.checkoutUrl = link.checkoutUrl
            payment.providerPaymentId = link.paymentLinkId || String(orderCode)
            return repo().save(payment)
        } catch (err) {
            const msg = err instanceof Error ? err.message : String(err)
            throw new AppError(`PayOS tạo link thất bại: ${msg}`, 502)
        }
    }

    static async createPayosCheckoutByOrder(orderId: string): Promise<Payment> {
        const payment = await repo().findOneBy({ orderId })
        if (!payment) throw new AppError("Không tìm thấy payment cho đơn này", 404)
        return this.createPayosCheckout(payment.id)
    }

    static async handlePayosWebhookPaid(data: {
        orderCode: number
        amount: number
        paymentLinkId?: string
    }): Promise<Payment | null> {
        const payment = await this.getByOrderCode(data.orderCode)
        if (!payment) {
            console.warn(`[payos] webhook orderCode=${data.orderCode} không khớp payment`)
            return null
        }
        if (payment.amount !== data.amount) {
            console.warn(
                `[payos] amount mismatch payment=${payment.amount} webhook=${data.amount}`,
            )
        }
        if (payment.status === "paid") return payment

        if (data.paymentLinkId) {
            payment.providerPaymentId = data.paymentLinkId
        }
        payment.provider = "payos"
        payment.status = "paid"
        payment.paidAt = new Date()
        const saved = await repo().save(payment)
        await notifyDiningOrderPaid(saved.orderId)
        return saved
    }

    static async syncPayosByOrderCode(orderCode: number): Promise<Payment | null> {
        const payOS = getPayOS()
        const info = await payOS.paymentRequests.get(orderCode)
        if (info.status !== "PAID") {
            return this.getByOrderCode(orderCode)
        }
        return this.handlePayosWebhookPaid({
            orderCode: Number(info.orderCode),
            amount: Number(info.amountPaid ?? info.amount),
            paymentLinkId: typeof info.id === "string" ? info.id : undefined,
        })
    }
}
