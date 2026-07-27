import { z } from "zod";

const quantityCreate = z.preprocess(
    (v) => (v === "" || v === null || v === undefined ? 1 : v),
    z.coerce.number().int().min(1, "quantity phải là số nguyên >= 1")
);

const quantityUpdate = z.preprocess((v) => {
    if (v === undefined) return undefined;
    if (v === "" || v === null) return undefined;
    return v;
}, z.coerce.number().int().min(1, "quantity phải là số nguyên >= 1").optional());

const optionalTrimmed = z
    .string()
    .trim()
    .optional()
    .transform((v) => (v === "" ? undefined : v));

export const idParamSchema = z.object({
    id: z.string().uuid("id phải là UUID hợp lệ"),
});

export const createRoomSchema = z.object({
    name: z.string().trim().min(1, "Tên phòng là bắt buộc"),
    area_size: z.coerce.number().positive("Diện tích phải lớn hơn 0"),
    style: optionalTrimmed,
});

export const updateRoomSchema = createRoomSchema.partial();

export const createTableSchema = z.object({
    name: z.string().trim().min(1, "name là bắt buộc"),
    material: z.string().trim().min(1, "material là bắt buộc"),
    shape: z.string().trim().min(1, "shape là bắt buộc"),
    dimensions: optionalTrimmed,
    quantity: quantityCreate,
    diningRoomId: z.string().uuid("diningRoomId phải là UUID hợp lệ"),
});

export const updateTableSchema = z.object({
    name: z.string().trim().min(1).optional(),
    material: z.string().trim().min(1).optional(),
    shape: z.string().trim().min(1).optional(),
    dimensions: optionalTrimmed,
    quantity: quantityUpdate,
    diningRoomId: z.string().uuid("diningRoomId phải là UUID hợp lệ").optional(),
});

export const createCabinetSchema = z.object({
    name: z.string().trim().min(1, "name là bắt buộc"),
    material: z.string().trim().min(1, "material là bắt buộc"),
    dimensions: optionalTrimmed,
    quantity: quantityCreate,
    diningRoomId: z.string().uuid("diningRoomId phải là UUID hợp lệ"),
});

export const updateCabinetSchema = z.object({
    name: z.string().trim().min(1).optional(),
    material: z.string().trim().min(1).optional(),
    dimensions: optionalTrimmed,
    quantity: quantityUpdate,
    diningRoomId: z.string().uuid("diningRoomId phải là UUID hợp lệ").optional(),
});

export const createChairSchema = z.object({
    name: z.string().trim().min(1, "name là bắt buộc"),
    material: z.string().trim().min(1, "material là bắt buộc"),
    color: optionalTrimmed,
    quantity: quantityCreate,
    diningTableId: z.string().uuid("diningTableId phải là UUID hợp lệ"),
});

export const updateChairSchema = z.object({
    name: z.string().trim().min(1).optional(),
    material: z.string().trim().min(1).optional(),
    color: optionalTrimmed,
    quantity: quantityUpdate,
    diningTableId: z.string().uuid("diningTableId phải là UUID hợp lệ").optional(),
});

export const createAccessorySchema = z.object({
    name: z.string().trim().min(1, "name là bắt buộc"),
    type: z.string().trim().min(1, "type là bắt buộc"),
    quantity: quantityCreate,
    diningTableId: z.string().uuid("diningTableId phải là UUID hợp lệ"),
});

export const updateAccessorySchema = z.object({
    name: z.string().trim().min(1).optional(),
    type: z.string().trim().min(1).optional(),
    quantity: quantityUpdate,
    diningTableId: z.string().uuid("diningTableId phải là UUID hợp lệ").optional(),
});
