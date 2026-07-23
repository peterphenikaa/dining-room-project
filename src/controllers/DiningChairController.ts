import { Request, Response } from "express";
import { DiningChairService } from "../services/DiningChairService";
import { AppError } from "../utils/AppError";
import { SuccessResponse } from "../utils/SuccessResponse";
import { parseOptionalQuantity, parseQuantity } from "../utils/quantity";

export const createChair = async (req: Request, res: Response) => {
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

    return SuccessResponse(res, 201, "Tạo ghế thành công!", newChair);
};

export const getAllChairs = async (req: Request, res: Response) => {
    const chairs = await DiningChairService.getAll();
    return SuccessResponse(res, 200, "Lấy danh sách ghế thành công", chairs);
};

export const getChairById = async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const chair = await DiningChairService.getById(id);

    if (!chair) {
        throw new AppError("Không tìm thấy ghế", 404);
    }

    return SuccessResponse(res, 200, "Lấy dữ liệu thành công", chair);
};

export const updateChair = async (req: Request, res: Response) => {
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

    return SuccessResponse(res, 200, "Cập nhật thành công!", updatedChair);
};

export const deleteChair = async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const isDeleted = await DiningChairService.delete(id);

    if (!isDeleted) {
        throw new AppError("Không tìm thấy ghế để xóa", 404);
    }

    return SuccessResponse(res, 200, "Đã xóa ghế thành công!", null);
};
