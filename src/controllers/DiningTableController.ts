import { Request, Response } from "express";
import { DiningTableService } from "../services/DiningTableService";
import { AppError } from "../utils/AppError";
import { SuccessResponse } from "../utils/SuccessResponse";

export const createTable = async (req: Request, res: Response) => {
    const { name, material, shape, dimensions, diningRoomId } = req.body;

    if (!name || !material || !shape || !diningRoomId) {
        throw new AppError("name, material, shape và diningRoomId là bắt buộc", 400);
    }

    const newTable = await DiningTableService.create({
        name,
        material,
        shape,
        dimensions,
        diningRoomId,
    });

    return SuccessResponse(res, 201, "Tạo bàn ăn thành công!", newTable);
};

export const getAllTables = async (req: Request, res: Response) => {
    const tables = await DiningTableService.getAll();
    return SuccessResponse(res, 200, "Lấy danh sách bàn ăn thành công", tables);
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
    const updatedTable = await DiningTableService.update(id, req.body);

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
