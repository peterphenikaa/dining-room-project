import { EntityManager } from "typeorm"
import { DiningAccessory } from "../entity/DiningAccessory"
import { DiningCabinet } from "../entity/DiningCabinet"
import { DiningChair } from "../entity/DiningChair"
import { DiningTable } from "../entity/DiningTable"
import type { ShopProductType } from "../entity/shopTypes"
import { AppError } from "../utils/AppError"

export type CatalogProduct = {
    id: string
    name: string
    price: number
    quantity: number
}

const entityByType = {
    table: DiningTable,
    chair: DiningChair,
    cabinet: DiningCabinet,
    accessory: DiningAccessory,
} as const

export function productEntity(type: ShopProductType) {
    return entityByType[type]
}

export async function findCatalogProduct(
    manager: EntityManager,
    productType: ShopProductType,
    productId: string,
    options?: { lock?: boolean },
): Promise<CatalogProduct | null> {
    const Entity = productEntity(productType)
    const repo = manager.getRepository(Entity)
    const row = options?.lock
        ? await repo
              .createQueryBuilder("p")
              .setLock("pessimistic_write")
              .where("p.id = :id", { id: productId })
              .getOne()
        : await repo.findOneBy({ id: productId })

    if (!row) return null
    return {
        id: row.id,
        name: row.name,
        price: row.price,
        quantity: row.quantity,
    }
}

export async function requireCatalogProduct(
    manager: EntityManager,
    productType: ShopProductType,
    productId: string,
    options?: { lock?: boolean },
): Promise<CatalogProduct> {
    const product = await findCatalogProduct(manager, productType, productId, options)
    if (!product) {
        throw new AppError(`Không tìm thấy sản phẩm (${productType})`, 404)
    }
    return product
}

export async function adjustStock(
    manager: EntityManager,
    productType: ShopProductType,
    productId: string,
    delta: number,
): Promise<void> {
    if (delta === 0) return

    const Entity = productEntity(productType)

    if (delta < 0) {
        const need = Math.abs(delta)
        const result = await manager
            .createQueryBuilder()
            .update(Entity)
            .set({ quantity: () => `quantity - ${need}` })
            .where("id = :id", { id: productId })
            .andWhere("quantity >= :need", { need })
            .execute()

        if (!result.affected) {
            throw new AppError("Không đủ tồn kho hoặc sản phẩm không tồn tại", 409)
        }
        return
    }

    const result = await manager.increment(Entity, { id: productId }, "quantity", delta)
    if (!result.affected) {
        throw new AppError("Sản phẩm không tồn tại", 404)
    }
}
