import { Request, Response } from "express";
import { DiningAccessoryService } from "../services/DiningAccessoryService";
import { cursorPaginationQuerySchema } from "../schemas/paginationSchemas";
import { AppError } from "../utils/AppError";
import { SuccessResponse } from "../utils/SuccessResponse";
import { parseOptionalQuantity, parseQuantity } from "../utils/quantity";

export const createAccessory = async (req: Request, res: Response) => {
    const { name, type, quantity, diningTableId } = req.body;

    if (!name || !type || !diningTableId) {
        throw new AppError("name, type và diningTableId là bắt buộc", 400);
    }

    const newAccessory = await DiningAccessoryService.create({
        name,
        type,
        quantity: parseQuantity(quantity),
        diningTableId,
    });

    return SuccessResponse(res, 201, "Tạo phụ kiện thành công!", newAccessory);
};

export const getAllAccessories = async (req: Request, res: Response) => {
    const query = cursorPaginationQuerySchema.parse(req.query);
    const page = await DiningAccessoryService.getAll(query);
    return SuccessResponse(res, 200, "Lấy danh sách phụ kiện thành công", page);
};

export const getAccessoryById = async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const accessory = await DiningAccessoryService.getById(id);

    if (!accessory) {
        throw new AppError("Không tìm thấy phụ kiện", 404);
    }

    return SuccessResponse(res, 200, "Lấy dữ liệu thành công", accessory);
};

export const updateAccessory = async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const { quantity, ...rest } = req.body;
    const parsedQty = parseOptionalQuantity(quantity);

    const updatedAccessory = await DiningAccessoryService.update(id, {
        ...rest,
        ...(parsedQty !== undefined ? { quantity: parsedQty } : {}),
    });

    if (!updatedAccessory) {
        throw new AppError("Không tìm thấy phụ kiện để sửa", 404);
    }

    return SuccessResponse(res, 200, "Cập nhật thành công!", updatedAccessory);
};

export const deleteAccessory = async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const isDeleted = await DiningAccessoryService.delete(id);

    if (!isDeleted) {
        throw new AppError("Không tìm thấy phụ kiện để xóa", 404);
    }

    return SuccessResponse(res, 200, "Đã xóa phụ kiện thành công!", null);
};
