import { Response } from "express";
import { DiningChairService } from "../services/DiningChairService";
import {
    createChairSchema,
    idParamSchema,
    updateChairSchema,
} from "../schemas/diningSchemas";
import { cursorPaginationQuerySchema } from "../schemas/paginationSchemas";
import { emitDiningChanged } from "../realtime/io";
import type { AuthRequest } from "../security";
import { AppError } from "../utils/AppError";
import { SuccessResponse } from "../utils/SuccessResponse";

export const createChair = async (req: AuthRequest, res: Response) => {
    const body = createChairSchema.parse(req.body);
    const newChair = await DiningChairService.create(body);

    emitDiningChanged({
        entityType: "chair",
        action: "create",
        entityId: newChair.id,
        actorId: req.user!.id,
        actorEmail: req.user!.email,
    });
    return SuccessResponse(res, 201, "Tạo ghế thành công!", newChair);
};

export const getAllChairs = async (req: AuthRequest, res: Response) => {
    const query = cursorPaginationQuerySchema.parse(req.query);
    const page = await DiningChairService.getAll(query);
    return SuccessResponse(res, 200, "Lấy danh sách ghế thành công", page);
};

export const getChairById = async (req: AuthRequest, res: Response) => {
    const { id } = idParamSchema.parse(req.params);
    const chair = await DiningChairService.getById(id);

    if (!chair) {
        throw new AppError("Không tìm thấy ghế", 404);
    }

    return SuccessResponse(res, 200, "Lấy dữ liệu thành công", chair);
};

export const updateChair = async (req: AuthRequest, res: Response) => {
    const { id } = idParamSchema.parse(req.params);
    const body = updateChairSchema.parse(req.body);
    const updatedChair = await DiningChairService.update(id, body);

    if (!updatedChair) {
        throw new AppError("Không tìm thấy ghế để sửa", 404);
    }

    emitDiningChanged({
        entityType: "chair",
        action: "update",
        entityId: updatedChair.id,
        actorId: req.user!.id,
        actorEmail: req.user!.email,
    });
    return SuccessResponse(res, 200, "Cập nhật thành công!", updatedChair);
};

export const deleteChair = async (req: AuthRequest, res: Response) => {
    const { id } = idParamSchema.parse(req.params);
    const isDeleted = await DiningChairService.delete(id);

    if (!isDeleted) {
        throw new AppError("Không tìm thấy ghế để xóa", 404);
    }

    emitDiningChanged({
        entityType: "chair",
        action: "delete",
        entityId: id,
        actorId: req.user!.id,
        actorEmail: req.user!.email,
    });
    return SuccessResponse(res, 200, "Đã xóa ghế thành công!", null);
};
