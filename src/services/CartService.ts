import { AppDataSource } from "../data-source"
import { Cart } from "../entity/Cart"
import { CartItem } from "../entity/CartItem"
import type { ShopProductType } from "../entity/shopTypes"
import { AppError } from "../utils/AppError"
import { findCatalogProduct, requireCatalogProduct } from "./shopProductCatalog"

const cartRepo = () => AppDataSource.getRepository(Cart)
const cartItemRepo = () => AppDataSource.getRepository(CartItem)

export type CartItemView = {
    id: string
    productType: ShopProductType
    productId: string
    quantity: number
    productName: string | null
    unitPrice: number | null
    stock: number | null
    lineTotal: number | null
    available: boolean
}

export type CartView = {
    id: string
    userId: string
    items: CartItemView[]
    totalAmount: number
    createdAt: Date
    updatedAt: Date
}

async function enrichItems(items: CartItem[]): Promise<CartItemView[]> {
    const views: CartItemView[] = []
    for (const item of items) {
        const product = await findCatalogProduct(
            AppDataSource.manager,
            item.productType,
            item.productId,
        )
        const available = !!product && product.price > 0 && product.quantity > 0
        const unitPrice = product?.price ?? null
        const lineTotal =
            unitPrice != null ? unitPrice * item.quantity : null
        views.push({
            id: item.id,
            productType: item.productType,
            productId: item.productId,
            quantity: item.quantity,
            productName: product?.name ?? null,
            unitPrice,
            stock: product?.quantity ?? null,
            lineTotal,
            available,
        })
    }
    return views
}

function toView(cart: Cart, items: CartItemView[]): CartView {
    const totalAmount = items.reduce((sum, i) => sum + (i.lineTotal ?? 0), 0)
    return {
        id: cart.id,
        userId: cart.userId,
        items,
        totalAmount,
        createdAt: cart.createdAt,
        updatedAt: cart.updatedAt,
    }
}

export class CartService {
    static async getOrCreate(userId: string): Promise<Cart> {
        let cart = await cartRepo().findOne({
            where: { userId },
            relations: ["items"],
        })
        if (!cart) {
            try {
                cart = cartRepo().create({ userId, items: [] })
                cart = await cartRepo().save(cart)
                cart.items = []
            } catch {
                // Request đồng thời có thể tạo cart trùng unique(userId), fallback đọc lại.
                const existing = await cartRepo().findOne({
                    where: { userId },
                    relations: ["items"],
                })
                if (!existing) throw new AppError("Không thể khởi tạo giỏ hàng", 500)
                cart = existing
            }
        }
        return cart
    }

    static async getView(userId: string): Promise<CartView> {
        const cart = await this.getOrCreate(userId)
        const items = await enrichItems(cart.items ?? [])
        return toView(cart, items)
    }

    static async addItem(
        userId: string,
        data: { productType: ShopProductType; productId: string; quantity: number },
    ): Promise<CartView> {
        await AppDataSource.transaction(async (manager) => {
            const product = await requireCatalogProduct(
                manager,
                data.productType,
                data.productId,
                { lock: true },
            )
            if (product.price <= 0) {
                throw new AppError("Sản phẩm chưa có giá bán", 400)
            }
            if (data.quantity > product.quantity) {
                throw new AppError(`Chỉ còn ${product.quantity} sản phẩm trong kho`, 409)
            }

            const cartRow = await manager
                .getRepository(Cart)
                .createQueryBuilder("cart")
                .setLock("pessimistic_write")
                .where("cart.userId = :userId", { userId })
                .getOne()

            const cart =
                cartRow ??
                (await manager.getRepository(Cart).save(
                    manager.getRepository(Cart).create({ userId }),
                ))

            const existing = await manager
                .getRepository(CartItem)
                .createQueryBuilder("item")
                .setLock("pessimistic_write")
                .where("item.cartId = :cartId", { cartId: cart.id })
                .andWhere("item.productType = :productType", { productType: data.productType })
                .andWhere("item.productId = :productId", { productId: data.productId })
                .getOne()

            if (existing) {
                const nextQty = existing.quantity + data.quantity
                if (nextQty > product.quantity) {
                    throw new AppError(`Chỉ còn ${product.quantity} sản phẩm trong kho`, 409)
                }
                existing.quantity = nextQty
                await manager.save(existing)
            } else {
                const item = manager.getRepository(CartItem).create({
                    cartId: cart.id,
                    productType: data.productType,
                    productId: data.productId,
                    quantity: data.quantity,
                })
                await manager.save(item)
            }
        })

        return this.getView(userId)
    }

    static async updateItem(
        userId: string,
        itemId: string,
        quantity: number,
    ): Promise<CartView> {
        await AppDataSource.transaction(async (manager) => {
            const cart = await manager
                .getRepository(Cart)
                .createQueryBuilder("cart")
                .setLock("pessimistic_write")
                .where("cart.userId = :userId", { userId })
                .getOne()
            if (!cart) throw new AppError("Giỏ hàng trống", 404)

            const item = await manager
                .getRepository(CartItem)
                .createQueryBuilder("item")
                .setLock("pessimistic_write")
                .where("item.id = :itemId", { itemId })
                .andWhere("item.cartId = :cartId", { cartId: cart.id })
                .getOne()
            if (!item) throw new AppError("Không tìm thấy dòng giỏ hàng", 404)

            const product = await requireCatalogProduct(
                manager,
                item.productType,
                item.productId,
                { lock: true },
            )
            if (quantity > product.quantity) {
                throw new AppError(`Chỉ còn ${product.quantity} sản phẩm trong kho`, 409)
            }

            item.quantity = quantity
            await manager.save(item)
        })
        return this.getView(userId)
    }

    static async removeItem(userId: string, itemId: string): Promise<CartView> {
        await AppDataSource.transaction(async (manager) => {
            const cart = await manager
                .getRepository(Cart)
                .createQueryBuilder("cart")
                .setLock("pessimistic_write")
                .where("cart.userId = :userId", { userId })
                .getOne()
            if (!cart) throw new AppError("Giỏ hàng trống", 404)

            const item = await manager
                .getRepository(CartItem)
                .createQueryBuilder("item")
                .setLock("pessimistic_write")
                .where("item.id = :itemId", { itemId })
                .andWhere("item.cartId = :cartId", { cartId: cart.id })
                .getOne()
            if (!item) throw new AppError("Không tìm thấy dòng giỏ hàng", 404)

            await manager.delete(CartItem, item.id)
        })
        return this.getView(userId)
    }

    static async clear(userId: string): Promise<CartView> {
        await AppDataSource.transaction(async (manager) => {
            const cart = await manager
                .getRepository(Cart)
                .createQueryBuilder("cart")
                .setLock("pessimistic_write")
                .where("cart.userId = :userId", { userId })
                .getOne()
            if (!cart) return
            await manager.delete(CartItem, { cartId: cart.id })
        })
        return this.getView(userId)
    }
}
