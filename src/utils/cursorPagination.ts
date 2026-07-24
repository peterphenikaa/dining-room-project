import { ObjectLiteral, Repository, SelectQueryBuilder } from "typeorm";
import type { CursorPage, CursorPaginationQuery } from "../schemas/paginationSchemas";

type PaginateOptions = CursorPaginationQuery & {
    alias: string;
    relations?: string[];
};

export async function paginateByCursor<T extends ObjectLiteral & { id: string }>(
    repository: Repository<T>,
    { cursor, limit, alias, relations = [] }: PaginateOptions
): Promise<CursorPage<T>> {
    const qb: SelectQueryBuilder<T> = repository.createQueryBuilder(alias);

    for (const relation of relations) {
        qb.leftJoinAndSelect(`${alias}.${relation}`, relation);
    }

    qb.orderBy(`${alias}.id`, "ASC").take(limit + 1);

    if (cursor) {
        qb.andWhere(`${alias}.id > :cursor`, { cursor });
    }

    const rows = await qb.getMany();
    const hasMore = rows.length > limit;
    const items = hasMore ? rows.slice(0, limit) : rows;
    const nextCursor = hasMore ? items[items.length - 1]?.id ?? null : null;

    return { items, nextCursor, hasMore };
}
