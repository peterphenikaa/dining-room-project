import { AppDataSource } from "../data-source"
import { Cart } from "../entity/Cart"
import { CartItem } from "../entity/CartItem"
import { Order } from "../entity/Order"
import { OrderItem } from "../entity/OrderItem"
import type { OrderStatus } from "../entity/shopTypes"
import type { CursorPaginationQuery } from "../schemas/paginationSchemas"
import { AppError } from "../utils/AppError"
import { paginateByCursor } from "../utils/cursorPagination"
import {
    adjustStock,
    requireCatalogProduct,
} from "./shopProductCatalog"
import { enqueueOrderOutbox } from "../messaging/outbox"

function makeOrderNumber(): string {
    const stamp = Date.now().toString(36).toUpperCase()
    const rand = Math.random().toString(36).slice(2, 6).toUpperCase()
    return `ORD-${stamp}-${rand}`
}

function stableProductKey(productType: string, productId: string): string {
    return `${productType}:${productId}`
}

export class OrderService {
    static async checkout(userId: string): Promise<Order> {
        return AppDataSource.transaction(async (manager) => {
            const cart = await manager
                .getRepository(Cart)
                .createQueryBuilder("cart")
                .setLock("pessimistic_write")
                .where("cart.userId = :userId", { userId })
                .getOne()

            if (!cart) {
                throw new AppError("Giỏ hàng trống", 400)
            }

            const cartItems = await manager
                .getRepository(CartItem)
                .createQueryBuilder("item")
                .setLock("pessimistic_write")
                .where("item.cartId = :cartId", { cartId: cart.id })
                .getMany()

            if (!cartItems.length) {
                throw new AppError("Giỏ hàng trống", 400)
            }

            const lines: Array<{
                productType: CartItem["productType"]
                productId: string
                productName: string
                unitPrice: number
                quantity: number
                lineTotal: number
            }> = []

            let totalAmount = 0

            const sortedCartItems = [...cartItems].sort((a, b) =>
                stableProductKey(a.productType, a.productId).localeCompare(
                    stableProductKey(b.productType, b.productId),
                ),
            )

            for (const item of sortedCartItems) {
                const product = await requireCatalogProduct(
                    manager,
                    item.productType,
                    item.productId,
                    { lock: true },
                )

                if (product.price <= 0) {
                    throw new AppError(
                        `Sản phẩm "${product.name}" chưa có giá bán`,
                        400,
                    )
                }
                if (item.quantity > product.quantity) {
                    throw new AppError(
                        `"${product.name}" chỉ còn ${product.quantity} trong kho`,
                        409,
                    )
                }

                const lineTotal = product.price * item.quantity
                totalAmount += lineTotal
                lines.push({
                    productType: item.productType,
                    productId: product.id,
                    productName: product.name,
                    unitPrice: product.price,
                    quantity: item.quantity,
                    lineTotal,
                })
            }

            const order = manager.create(Order, {
                orderNumber: makeOrderNumber(),
                userId,
                status: "pending_payment" satisfies OrderStatus,
                totalAmount,
            })
            const savedOrder = await manager.save(order)

            const orderItems = lines.map((line) =>
                manager.create(OrderItem, {
                    orderId: savedOrder.id,
                    ...line,
                }),
            )
            await manager.save(orderItems)

            for (const line of lines) {
                await adjustStock(
                    manager,
                    line.productType,
                    line.productId,
                    -line.quantity,
                )
            }

            await manager.delete(CartItem, { cartId: cart.id })

            const orderWithItems = await manager.findOneOrFail(Order, {
                where: { id: savedOrder.id },
                relations: ["items"],
            })

            await enqueueOrderOutbox(manager, {
                type: "OrderCreated",
                orderId: orderWithItems.id,
                orderNumber: orderWithItems.orderNumber,
                userId: orderWithItems.userId,
                totalAmount: orderWithItems.totalAmount,
                itemCount: orderWithItems.items?.length ?? 0,
                occurredAt: new Date().toISOString(),
            })

            return orderWithItems
        })
    }

    static async cancel(orderId: string, userId: string, isAdmin: boolean): Promise<Order> {
        return AppDataSource.transaction(async (manager) => {
            const order = await manager
                .getRepository(Order)
                .createQueryBuilder("o")
                .setLock("pessimistic_write")
                .where("o.id = :id", { id: orderId })
                .getOne()

            if (!order) throw new AppError("Không tìm thấy đơn hàng", 404)
            if (!isAdmin && order.userId !== userId) {
                throw new AppError("Không có quyền hủy đơn này", 403)
            }
            if (order.status !== "pending_payment") {
                throw new AppError("Chỉ hủy được đơn đang chờ thanh toán", 400)
            }

            const items = await manager.find(OrderItem, {
                where: { orderId: order.id },
            })

            const sortedItems = [...items].sort((a, b) =>
                stableProductKey(a.productType, a.productId).localeCompare(
                    stableProductKey(b.productType, b.productId),
                ),
            )

            for (const item of sortedItems) {
                await adjustStock(
                    manager,
                    item.productType,
                    item.productId,
                    item.quantity,
                )
            }

            order.status = "cancelled"
            await manager.save(order)

            return manager.findOneOrFail(Order, {
                where: { id: order.id },
                relations: ["items"],
            })
        })
    }

    static async markPaid(orderId: string): Promise<Order> {
        return AppDataSource.transaction(async (manager) => {
            const order = await manager
                .getRepository(Order)
                .createQueryBuilder("o")
                .setLock("pessimistic_write")
                .where("o.id = :id", { id: orderId })
                .getOne()

            if (!order) throw new AppError("Không tìm thấy đơn hàng", 404)
            if (order.status === "paid") {
                return manager.findOneOrFail(Order, {
                    where: { id: order.id },
                    relations: ["items"],
                })
            }
            if (order.status !== "pending_payment") {
                throw new AppError("Chỉ xác nhận thanh toán cho đơn đang chờ", 400)
            }

            order.status = "paid"
            await manager.save(order)

            return manager.findOneOrFail(Order, {
                where: { id: order.id },
                relations: ["items"],
            })
        })
    }

    static async getMine(userId: string, query: CursorPaginationQuery) {
        const { cursor, limit } = query
        const qb = AppDataSource.getRepository(Order)
            .createQueryBuilder("ord")
            .leftJoinAndSelect("ord.items", "items")
            .where("ord.userId = :userId", { userId })
            .orderBy("ord.id", "ASC")
            .take(limit + 1)

        if (cursor) {
            qb.andWhere("ord.id > :cursor", { cursor })
        }

        const rows = await qb.getMany()
        const hasMore = rows.length > limit
        const items = hasMore ? rows.slice(0, limit) : rows
        const nextCursor = hasMore ? items[items.length - 1]?.id ?? null : null
        return { items, nextCursor, hasMore }
    }

    static async getAll(query: CursorPaginationQuery) {
        return paginateByCursor(AppDataSource.getRepository(Order), {
            ...query,
            alias: "ord",
            relations: ["items"],
        })
    }

    static async getById(id: string, userId: string, isAdmin: boolean) {
        const order = await AppDataSource.getRepository(Order).findOne({
            where: { id },
            relations: ["items"],
        })
        if (!order) return null
        if (!isAdmin && order.userId !== userId) {
            throw new AppError("Không có quyền xem đơn này", 403)
        }
        return order
    }
}
