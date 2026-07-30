import { Response } from "express";
import { DiningAccessoryService } from "../services/DiningAccessoryService";
import {
    createAccessorySchema,
    idParamSchema,
    updateAccessorySchema,
} from "../schemas/diningSchemas";
import { cursorPaginationQuerySchema } from "../schemas/paginationSchemas";
import { emitDiningChanged } from "../realtime/io";
import type { AuthRequest } from "../security";
import { AppError } from "../utils/AppError";
import { SuccessResponse } from "../utils/SuccessResponse";

export const createAccessory = async (req: AuthRequest, res: Response) => {
    const body = createAccessorySchema.parse(req.body);
    const newAccessory = await DiningAccessoryService.create(body);

    emitDiningChanged({
        entityType: "accessory",
        action: "create",
        entityId: newAccessory.id,
        actorId: req.user!.id,
        actorEmail: req.user!.email,
    });
    return SuccessResponse(res, 201, "Tạo phụ kiện thành công!", newAccessory);
};

export const getAllAccessories = async (req: AuthRequest, res: Response) => {
    const query = cursorPaginationQuerySchema.parse(req.query);
    const page = await DiningAccessoryService.getAll(query);
    return SuccessResponse(res, 200, "Lấy danh sách phụ kiện thành công", page);
};

export const getAccessoryById = async (req: AuthRequest, res: Response) => {
    const { id } = idParamSchema.parse(req.params);
    const accessory = await DiningAccessoryService.getById(id);

    if (!accessory) {
        throw new AppError("Không tìm thấy phụ kiện", 404);
    }

    return SuccessResponse(res, 200, "Lấy dữ liệu thành công", accessory);
};

export const updateAccessory = async (req: AuthRequest, res: Response) => {
    const { id } = idParamSchema.parse(req.params);
    const body = updateAccessorySchema.parse(req.body);
    const updatedAccessory = await DiningAccessoryService.update(id, body);

    if (!updatedAccessory) {
        throw new AppError("Không tìm thấy phụ kiện để sửa", 404);
    }

    emitDiningChanged({
        entityType: "accessory",
        action: "update",
        entityId: updatedAccessory.id,
        actorId: req.user!.id,
        actorEmail: req.user!.email,
    });
    return SuccessResponse(res, 200, "Cập nhật thành công!", updatedAccessory);
};

export const deleteAccessory = async (req: AuthRequest, res: Response) => {
    const { id } = idParamSchema.parse(req.params);
    const isDeleted = await DiningAccessoryService.delete(id);

    if (!isDeleted) {
        throw new AppError("Không tìm thấy phụ kiện để xóa", 404);
    }

    emitDiningChanged({
        entityType: "accessory",
        action: "delete",
        entityId: id,
        actorId: req.user!.id,
        actorEmail: req.user!.email,
    });
    return SuccessResponse(res, 200, "Đã xóa phụ kiện thành công!", null);
};
