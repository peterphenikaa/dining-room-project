import { Response } from "express";
import { DiningCabinetService } from "../services/DiningCabinetService";
import {
    createCabinetSchema,
    idParamSchema,
    updateCabinetSchema,
} from "../schemas/diningSchemas";
import { cursorPaginationQuerySchema } from "../schemas/paginationSchemas";
import { emitDiningChanged } from "../realtime/io";
import { AuthRequest } from "../types/auth";
import { AppError } from "../utils/AppError";
import { SuccessResponse } from "../utils/SuccessResponse";

export const createCabinet = async (req: AuthRequest, res: Response) => {
    const body = createCabinetSchema.parse(req.body);
    const newCabinet = await DiningCabinetService.create(body);

    emitDiningChanged({
        entityType: "cabinet",
        action: "create",
        entityId: newCabinet.id,
        actorId: req.user!.id,
        actorEmail: req.user!.email,
    });
    return SuccessResponse(res, 201, "Tạo tủ thành công!", newCabinet);
};

export const getAllCabinets = async (req: AuthRequest, res: Response) => {
    const query = cursorPaginationQuerySchema.parse(req.query);
    const page = await DiningCabinetService.getAll(query);
    return SuccessResponse(res, 200, "Lấy danh sách tủ thành công", page);
};

export const getCabinetById = async (req: AuthRequest, res: Response) => {
    const { id } = idParamSchema.parse(req.params);
    const cabinet = await DiningCabinetService.getById(id);

    if (!cabinet) {
        throw new AppError("Không tìm thấy tủ", 404);
    }

    return SuccessResponse(res, 200, "Lấy dữ liệu thành công", cabinet);
};

export const updateCabinet = async (req: AuthRequest, res: Response) => {
    const { id } = idParamSchema.parse(req.params);
    const body = updateCabinetSchema.parse(req.body);
    const updatedCabinet = await DiningCabinetService.update(id, body);

    if (!updatedCabinet) {
        throw new AppError("Không tìm thấy tủ để sửa", 404);
    }

    emitDiningChanged({
        entityType: "cabinet",
        action: "update",
        entityId: updatedCabinet.id,
        actorId: req.user!.id,
        actorEmail: req.user!.email,
    });
    return SuccessResponse(res, 200, "Cập nhật thành công!", updatedCabinet);
};

export const deleteCabinet = async (req: AuthRequest, res: Response) => {
    const { id } = idParamSchema.parse(req.params);
    const isDeleted = await DiningCabinetService.delete(id);

    if (!isDeleted) {
        throw new AppError("Không tìm thấy tủ để xóa", 404);
    }

    emitDiningChanged({
        entityType: "cabinet",
        action: "delete",
        entityId: id,
        actorId: req.user!.id,
        actorEmail: req.user!.email,
    });
    return SuccessResponse(res, 200, "Đã xóa tủ thành công!", null);
};
