import { Response } from "express"
import { z } from "zod"
import { paymentServiceConfig } from "../config/env"
import { OrderService } from "../services/OrderService"
import { PaymentClient } from "../services/PaymentClient"
import { orderIdParamSchema } from "../schemas/orderSchemas"
import { cursorPaginationQuerySchema } from "../schemas/paginationSchemas"
import type { AuthRequest } from "../security"
import { AppError } from "../utils/AppError"
import { SuccessResponse } from "../utils/SuccessResponse"

function forwardCookie(req: AuthRequest): string | undefined {
    const raw = req.headers.cookie
    return typeof raw === "string" ? raw : undefined
}

export const checkout = async (req: AuthRequest, res: Response) => {
    const order = await OrderService.checkout(req.user!.id)
    const cookie = forwardCookie(req)

    const payment = await PaymentClient.createPending(
        {
            orderId: order.id,
            orderNumber: order.orderNumber,
            userId: order.userId,
            amount: order.totalAmount,
        },
        cookie,
    )


    return SuccessResponse(res, 201, "Đặt hàng thành công", {
        ...order,
        payment,
        paymentWarning: payment
            ? undefined
            : "Đơn đã tạo nhưng chưa tạo được payment — admin có thể retry sau",
    })
}

export const getMyOrders = async (req: AuthRequest, res: Response) => {
    const query = cursorPaginationQuerySchema.parse(req.query)
    const page = await OrderService.getMine(req.user!.id, query)
    return SuccessResponse(res, 200, "Đơn hàng của tôi", page)
}

export const getAllOrders = async (req: AuthRequest, res: Response) => {
    const query = cursorPaginationQuerySchema.parse(req.query)
    const page = await OrderService.getAll(query)
    return SuccessResponse(res, 200, "Danh sách đơn hàng", page)
}

export const getOrderById = async (req: AuthRequest, res: Response) => {
    const { id } = orderIdParamSchema.parse(req.params)
    const isAdmin = req.user!.role === "admin"
    const order = await OrderService.getById(id, req.user!.id, isAdmin)
    if (!order) throw new AppError("Không tìm thấy đơn hàng", 404)
    const payment = await PaymentClient.getByOrder(id, forwardCookie(req))
    return SuccessResponse(res, 200, "Chi tiết đơn hàng", { ...order, payment })
}

export const cancelOrder = async (req: AuthRequest, res: Response) => {
    const { id } = orderIdParamSchema.parse(req.params)
    const isAdmin = req.user!.role === "admin"
    const order = await OrderService.cancel(id, req.user!.id, isAdmin)
    await PaymentClient.cancelByOrder(id, forwardCookie(req))
    return SuccessResponse(res, 200, "Đã hủy đơn hàng", order)
}

export const markOrderPaid = async (req: AuthRequest, res: Response) => {
    const { id } = orderIdParamSchema.parse(req.params)
    const existing = await OrderService.getById(id, req.user!.id, true)
    if (!existing) throw new AppError("Không tìm thấy đơn hàng", 404)
    if (existing.status === "cancelled") {
        throw new AppError("Đơn đã hủy", 400)
    }

    const cookie = forwardCookie(req)
    let payment = await PaymentClient.getByOrder(id, cookie)
    if (!payment) {
        payment = await PaymentClient.createPending(
            {
                orderId: existing.id,
                orderNumber: existing.orderNumber,
                userId: existing.userId,
                amount: existing.totalAmount,
            },
            cookie,
        )
        if (!payment) {
            throw new AppError("Không tạo được payment — kiểm tra Payment service", 502)
        }
    }

    await PaymentClient.markPaidByOrder(id, cookie)
    const order = await OrderService.markPaid(id)
    return SuccessResponse(res, 200, "Đã xác nhận thanh toán", order)
}

export const createPayosCheckout = async (req: AuthRequest, res: Response) => {
    const { id } = orderIdParamSchema.parse(req.params)
    const isAdmin = req.user!.role === "admin"
    const order = await OrderService.getById(id, req.user!.id, isAdmin)
    if (!order) throw new AppError("Không tìm thấy đơn hàng", 404)
    if (order.status !== "pending_payment") {
        throw new AppError("Chỉ thanh toán được đơn đang chờ", 400)
    }

    const cookie = forwardCookie(req)
    let payment = await PaymentClient.getByOrder(id, cookie)
    if (!payment) {
        payment = await PaymentClient.createPending(
            {
                orderId: order.id,
                orderNumber: order.orderNumber,
                userId: order.userId,
                amount: order.totalAmount,
            },
            cookie,
        )
        if (!payment) {
            throw new AppError("Không tạo được payment — kiểm tra Payment service", 502)
        }
    }

    payment = await PaymentClient.createPayosCheckoutByOrder(id, cookie)
    return SuccessResponse(res, 200, "Đã tạo link PayOS", {
        orderId: order.id,
        checkoutUrl: payment.checkoutUrl,
        payment,
    })
}

export const syncPayosPayment = async (req: AuthRequest, res: Response) => {
    const { id } = orderIdParamSchema.parse(req.params)
    const isAdmin = req.user!.role === "admin"
    const order = await OrderService.getById(id, req.user!.id, isAdmin)
    if (!order) throw new AppError("Không tìm thấy đơn hàng", 404)

    const cookie = forwardCookie(req)
    await PaymentClient.syncPayosByOrder(id, cookie)
    const refreshed = await OrderService.getById(id, req.user!.id, isAdmin)
    return SuccessResponse(res, 200, "Đã đồng bộ trạng thái PayOS", refreshed)
}

export const syncPayosByCode = async (req: AuthRequest, res: Response) => {
    const { orderCode } = z
        .object({ orderCode: z.coerce.number().int().positive() })
        .parse(req.body)
    const isAdmin = req.user!.role === "admin"
    const cookie = forwardCookie(req)
    const payment = await PaymentClient.syncPayosByOrderCode(orderCode, cookie)
    const order = await OrderService.getById(payment.orderId, req.user!.id, isAdmin)
    if (!order) throw new AppError("Không tìm thấy đơn hàng", 404)
    return SuccessResponse(res, 200, "Đã đồng bộ trạng thái PayOS", order)
}

const internalMarkPaidSchema = z.object({
    orderId: z.string().uuid(),
})

export const internalMarkPaid = async (req: AuthRequest, res: Response) => {
    const secret = req.headers["x-payment-callback-secret"]
    if (secret !== paymentServiceConfig.callbackSecret) {
        throw new AppError("Unauthorized callback", 401)
    }
    const { orderId } = internalMarkPaidSchema.parse(req.body)
    const order = await OrderService.markPaid(orderId)
    return SuccessResponse(res, 200, "Đã cập nhật đơn paid từ Payment", order)
}
