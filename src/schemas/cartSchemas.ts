import { z } from "zod"

export const productTypeSchema = z.enum(["table", "chair", "cabinet", "accessory"])

export const addCartItemSchema = z.object({
    productType: productTypeSchema,
    productId: z.string().uuid("productId phải là UUID hợp lệ"),
    quantity: z.coerce.number().int().min(1, "quantity phải >= 1").default(1),
})

export const updateCartItemSchema = z.object({
    quantity: z.coerce.number().int().min(1, "quantity phải >= 1"),
})

export const cartItemIdParamSchema = z.object({
    id: z.string().uuid("id phải là UUID hợp lệ"),
})
