import { z } from "zod"

export const createPaymentSchema = z.object({
    orderId: z.string().uuid("orderId phải là UUID"),
    orderNumber: z.string().trim().min(1).max(32),
    userId: z.string().uuid("userId phải là UUID"),
    amount: z.coerce.number().int().positive("amount phải > 0"),
})

export const paymentIdParamSchema = z.object({
    id: z.string().uuid("id phải là UUID"),
})

export const orderIdParamSchema = z.object({
    orderId: z.string().uuid("orderId phải là UUID"),
})
