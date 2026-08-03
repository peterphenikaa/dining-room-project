import { Response } from "express"
import { CartService } from "../services/CartService"
import {
    addCartItemSchema,
    cartItemIdParamSchema,
    updateCartItemSchema,
} from "../schemas/cartSchemas"
import type { AuthRequest } from "../security"
import { SuccessResponse } from "../utils/SuccessResponse"
import type { ShopProductType } from "../entity/shopTypes"

export const getCart = async (req: AuthRequest, res: Response) => {
    const cart = await CartService.getView(req.user!.id)
    return SuccessResponse(res, 200, "Lấy giỏ hàng thành công", cart)
}

export const addCartItem = async (req: AuthRequest, res: Response) => {
    const body = addCartItemSchema.parse(req.body)
    const cart = await CartService.addItem(req.user!.id, {
        productType: body.productType as ShopProductType,
        productId: body.productId,
        quantity: body.quantity,
    })
    return SuccessResponse(res, 200, "Đã thêm vào giỏ", cart)
}

export const updateCartItem = async (req: AuthRequest, res: Response) => {
    const { id } = cartItemIdParamSchema.parse(req.params)
    const body = updateCartItemSchema.parse(req.body)
    const cart = await CartService.updateItem(req.user!.id, id, body.quantity)
    return SuccessResponse(res, 200, "Đã cập nhật giỏ hàng", cart)
}

export const removeCartItem = async (req: AuthRequest, res: Response) => {
    const { id } = cartItemIdParamSchema.parse(req.params)
    const cart = await CartService.removeItem(req.user!.id, id)
    return SuccessResponse(res, 200, "Đã xóa khỏi giỏ", cart)
}

export const clearCart = async (req: AuthRequest, res: Response) => {
    const cart = await CartService.clear(req.user!.id)
    return SuccessResponse(res, 200, "Đã xóa giỏ hàng", cart)
}
