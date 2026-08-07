import { Request, Response } from "express"
import { z } from "zod"
import { PaymentService } from "../services/PaymentService"
import {
    createPaymentSchema,
    orderIdParamSchema,
    paymentIdParamSchema,
} from "../schemas/paymentSchemas"
import type { AuthRequest } from "../../../security"
import { AppError } from "../../../utils/AppError"
import { SuccessResponse } from "../../../utils/SuccessResponse"
import { getPayOS } from "../payos/payosClient"

export const createPayment = async (req: AuthRequest, res: Response) => {
    const body = createPaymentSchema.parse(req.body)
    if (req.user!.role !== "admin" && body.userId !== req.user!.id) {
        throw new AppError("Không được tạo payment cho user khác", 403)
    }
    const payment = await PaymentService.createPending(body)
    return SuccessResponse(res, 201, "Tạo payment pending", payment)
}

export const getPaymentByOrder = async (req: AuthRequest, res: Response) => {
    const { orderId } = orderIdParamSchema.parse(req.params)
    const payment = await PaymentService.getByOrderId(orderId)
    if (!payment) throw new AppError("Không tìm thấy payment", 404)
    if (req.user!.role !== "admin" && payment.userId !== req.user!.id) {
        throw new AppError("Không có quyền xem payment này", 403)
    }
    return SuccessResponse(res, 200, "Chi tiết payment", payment)
}

export const getPaymentById = async (req: AuthRequest, res: Response) => {
    const { id } = paymentIdParamSchema.parse(req.params)
    const payment = await PaymentService.getById(id)
    if (!payment) throw new AppError("Không tìm thấy payment", 404)
    if (req.user!.role !== "admin" && payment.userId !== req.user!.id) {
        throw new AppError("Không có quyền xem payment này", 403)
    }
    return SuccessResponse(res, 200, "Chi tiết payment", payment)
}

export const markPaid = async (req: AuthRequest, res: Response) => {
    const { id } = paymentIdParamSchema.parse(req.params)
    const payment = await PaymentService.markPaid(id)
    return SuccessResponse(res, 200, "Đã đánh dấu thanh toán", payment)
}

export const markPaidByOrder = async (req: AuthRequest, res: Response) => {
    const { orderId } = orderIdParamSchema.parse(req.params)
    const payment = await PaymentService.markPaidByOrder(orderId)
    return SuccessResponse(res, 200, "Đã đánh dấu thanh toán", payment)
}

export const cancelByOrder = async (req: AuthRequest, res: Response) => {
    const { orderId } = orderIdParamSchema.parse(req.params)

    const payment = await PaymentService.getByOrderId(orderId)
    if (!payment) throw new AppError("Không tìm thấy payment", 404)

    if (req.user!.role !== "admin" && payment.userId !== req.user!.id) {
        throw new AppError("Không có quyền hủy payment này", 403)
    }

    const cancelled = await PaymentService.cancelByOrder(orderId)
    return SuccessResponse(res, 200, "Đã hủy payment", cancelled)
}

export const createPayosCheckout = async (req: AuthRequest, res: Response) => {
    const { id } = paymentIdParamSchema.parse(req.params)
    const existing = await PaymentService.getById(id)
    if (!existing) throw new AppError("Không tìm thấy payment", 404)
    if (req.user!.role !== "admin" && existing.userId !== req.user!.id) {
        throw new AppError("Không có quyền thanh toán payment này", 403)
    }
    const payment = await PaymentService.createPayosCheckout(id)
    return SuccessResponse(res, 200, "Đã tạo link PayOS", payment)
}

export const createPayosCheckoutByOrder = async (req: AuthRequest, res: Response) => {
    const { orderId } = orderIdParamSchema.parse(req.params)
    const existing = await PaymentService.getByOrderId(orderId)
    if (!existing) throw new AppError("Không tìm thấy payment", 404)
    if (req.user!.role !== "admin" && existing.userId !== req.user!.id) {
        throw new AppError("Không có quyền thanh toán đơn này", 403)
    }
    const payment = await PaymentService.createPayosCheckoutByOrder(orderId)
    return SuccessResponse(res, 200, "Đã tạo link PayOS", payment)
}

export const syncPayosByOrder = async (req: AuthRequest, res: Response) => {
    const { orderId } = orderIdParamSchema.parse(req.params)
    const payment = await PaymentService.getByOrderId(orderId)
    if (!payment) throw new AppError("Không tìm thấy payment", 404)
    if (req.user!.role !== "admin" && payment.userId !== req.user!.id) {
        throw new AppError("Không có quyền", 403)
    }
    if (!payment.orderCode) {
        throw new AppError("Payment chưa có orderCode PayOS", 400)
    }
    const synced = await PaymentService.syncPayosByOrderCode(Number(payment.orderCode))
    return SuccessResponse(res, 200, "Đã đồng bộ PayOS", synced)
}

export const syncPayosByOrderCode = async (req: AuthRequest, res: Response) => {
    const { orderCode } = z
        .object({ orderCode: z.coerce.number().int().positive() })
        .parse(req.body)
    const payment = await PaymentService.getByOrderCode(orderCode)
    if (!payment) throw new AppError("Không tìm thấy payment", 404)
    if (req.user!.role !== "admin" && payment.userId !== req.user!.id) {
        throw new AppError("Không có quyền", 403)
    }
    const synced = await PaymentService.syncPayosByOrderCode(orderCode)
    return SuccessResponse(res, 200, "Đã đồng bộ PayOS", synced)
}

export const payosWebhook = async (req: Request, res: Response) => {
    try {
        const payOS = getPayOS()
        const webhookData = await payOS.webhooks.verify(req.body)
        const orderCode = Number(webhookData.orderCode)
        const amount = Number(webhookData.amount)
        const paymentLinkId =
            typeof webhookData.paymentLinkId === "string"
                ? webhookData.paymentLinkId
                : undefined

        await PaymentService.handlePayosWebhookPaid({
            orderCode,
            amount,
            paymentLinkId,
        })

        return res.status(200).json({ success: true })
    } catch (err) {
        console.error("[payos] webhook invalid:", err)
        return res.status(400).json({ success: false, message: "Invalid webhook" })
    }
}
