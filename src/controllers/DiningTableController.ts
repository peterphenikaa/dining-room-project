import { Response } from "express";
import { DiningTableService } from "../services/DiningTableService";
import {
    createTableSchema,
    idParamSchema,
    updateTableSchema,
} from "../schemas/diningSchemas";
import { cursorPaginationQuerySchema } from "../schemas/paginationSchemas";
import { emitDiningChanged } from "../realtime/io";
import { AuthRequest } from "../types/auth";
import { AppError } from "../utils/AppError";
import { SuccessResponse } from "../utils/SuccessResponse";

export const createTable = async (req: AuthRequest, res: Response) => {
    const body = createTableSchema.parse(req.body);
    const newTable = await DiningTableService.create(body);

    emitDiningChanged({
        entityType: "table",
        action: "create",
        entityId: newTable.id,
        actorId: req.user!.id,
        actorEmail: req.user!.email,
    });
    return SuccessResponse(res, 201, "Tạo bàn ăn thành công!", newTable);
};

export const getAllTables = async (req: AuthRequest, res: Response) => {
    const query = cursorPaginationQuerySchema.parse(req.query);
    const page = await DiningTableService.getAll(query);
    return SuccessResponse(res, 200, "Lấy danh sách bàn ăn thành công", page);
};

export const getTableById = async (req: AuthRequest, res: Response) => {
    const { id } = idParamSchema.parse(req.params);
    const table = await DiningTableService.getById(id);

    if (!table) {
        throw new AppError("Không tìm thấy bàn ăn", 404);
    }

    return SuccessResponse(res, 200, "Lấy dữ liệu thành công", table);
};

export const updateTable = async (req: AuthRequest, res: Response) => {
    const { id } = idParamSchema.parse(req.params);
    const body = updateTableSchema.parse(req.body);
    const updatedTable = await DiningTableService.update(id, body);

    if (!updatedTable) {
        throw new AppError("Không tìm thấy bàn ăn để sửa", 404);
    }

    emitDiningChanged({
        entityType: "table",
        action: "update",
        entityId: updatedTable.id,
        actorId: req.user!.id,
        actorEmail: req.user!.email,
    });
    return SuccessResponse(res, 200, "Cập nhật thành công!", updatedTable);
};

export const deleteTable = async (req: AuthRequest, res: Response) => {
    const { id } = idParamSchema.parse(req.params);
    const isDeleted = await DiningTableService.delete(id);

    if (!isDeleted) {
        throw new AppError("Không tìm thấy bàn ăn để xóa", 404);
    }

    emitDiningChanged({
        entityType: "table",
        action: "delete",
        entityId: id,
        actorId: req.user!.id,
        actorEmail: req.user!.email,
    });
    return SuccessResponse(res, 200, "Đã xóa bàn ăn thành công!", null);
};
