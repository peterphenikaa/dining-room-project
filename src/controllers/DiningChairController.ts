import { Response } from "express";
import { DiningChairService } from "../services/DiningChairService";
import { cursorPaginationQuerySchema } from "../schemas/paginationSchemas";
import { emitDiningChanged } from "../realtime/io";
import { AuthRequest } from "../types/auth";
import { AppError } from "../utils/AppError";
import { SuccessResponse } from "../utils/SuccessResponse";
import { parseOptionalQuantity, parseQuantity } from "../utils/quantity";

export const createChair = async (req: AuthRequest, res: Response) => {
    const { name, material, color, quantity, diningTableId } = req.body;

    if (!name || !material || !diningTableId) {
        throw new AppError("name, material và diningTableId là bắt buộc", 400);
    }

    const newChair = await DiningChairService.create({
        name,
        material,
        color,
        quantity: parseQuantity(quantity),
        diningTableId,
    });

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
    const id = req.params.id as string;
    const chair = await DiningChairService.getById(id);

    if (!chair) {
        throw new AppError("Không tìm thấy ghế", 404);
    }

    return SuccessResponse(res, 200, "Lấy dữ liệu thành công", chair);
};

export const updateChair = async (req: AuthRequest, res: Response) => {
    const id = req.params.id as string;
    const { quantity, ...rest } = req.body;
    const parsedQty = parseOptionalQuantity(quantity);

    const updatedChair = await DiningChairService.update(id, {
        ...rest,
        ...(parsedQty !== undefined ? { quantity: parsedQty } : {}),
    });

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
    const id = req.params.id as string;
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
