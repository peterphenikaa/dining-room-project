import { Request, Response } from "express";
import { DiningTableService } from "../services/DiningTableService";
import { cursorPaginationQuerySchema } from "../schemas/paginationSchemas";
import { AppError } from "../utils/AppError";
import { SuccessResponse } from "../utils/SuccessResponse";
import { parseOptionalQuantity, parseQuantity } from "../utils/quantity";

export const createTable = async (req: Request, res: Response) => {
    const { name, material, shape, dimensions, quantity, diningRoomId } = req.body;

    if (!name || !material || !shape || !diningRoomId) {
        throw new AppError("name, material, shape và diningRoomId là bắt buộc", 400);
    }

    const newTable = await DiningTableService.create({
        name,
        material,
        shape,
        dimensions,
        quantity: parseQuantity(quantity),
        diningRoomId,
    });

    return SuccessResponse(res, 201, "Tạo bàn ăn thành công!", newTable);
};

export const getAllTables = async (req: Request, res: Response) => {
    const query = cursorPaginationQuerySchema.parse(req.query);
    const page = await DiningTableService.getAll(query);
    return SuccessResponse(res, 200, "Lấy danh sách bàn ăn thành công", page);
};

export const getTableById = async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const table = await DiningTableService.getById(id);

    if (!table) {
        throw new AppError("Không tìm thấy bàn ăn", 404);
    }

    return SuccessResponse(res, 200, "Lấy dữ liệu thành công", table);
};

export const updateTable = async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const { quantity, ...rest } = req.body;
    const parsedQty = parseOptionalQuantity(quantity);

    const updatedTable = await DiningTableService.update(id, {
        ...rest,
        ...(parsedQty !== undefined ? { quantity: parsedQty } : {}),
    });

    if (!updatedTable) {
        throw new AppError("Không tìm thấy bàn ăn để sửa", 404);
    }

    return SuccessResponse(res, 200, "Cập nhật thành công!", updatedTable);
};

export const deleteTable = async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const isDeleted = await DiningTableService.delete(id);

    if (!isDeleted) {
        throw new AppError("Không tìm thấy bàn ăn để xóa", 404);
    }

    return SuccessResponse(res, 200, "Đã xóa bàn ăn thành công!", null);
};
