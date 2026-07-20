import { Request, Response } from "express";
import { DiningCabinetService } from "../services/DiningCabinetService";
import { AppError } from "../utils/AppError";
import { SuccessResponse } from "../utils/SuccessResponse";

export const createCabinet = async (req: Request, res: Response) => {
    const { name, material, dimensions, diningRoomId } = req.body;

    if (!name || !material || !diningRoomId) {
        throw new AppError("name, material và diningRoomId là bắt buộc", 400);
    }

    const newCabinet = await DiningCabinetService.create({
        name,
        material,
        dimensions,
        diningRoomId,
    });

    return SuccessResponse(res, 201, "Tạo tủ thành công!", newCabinet);
};

export const getAllCabinets = async (req: Request, res: Response) => {
    const cabinets = await DiningCabinetService.getAll();
    return SuccessResponse(res, 200, "Lấy danh sách tủ thành công", cabinets);
};

export const getCabinetById = async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const cabinet = await DiningCabinetService.getById(id);

    if (!cabinet) {
        throw new AppError("Không tìm thấy tủ", 404);
    }

    return SuccessResponse(res, 200, "Lấy dữ liệu thành công", cabinet);
};

export const updateCabinet = async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const updatedCabinet = await DiningCabinetService.update(id, req.body);

    if (!updatedCabinet) {
        throw new AppError("Không tìm thấy tủ để sửa", 404);
    }

    return SuccessResponse(res, 200, "Cập nhật thành công!", updatedCabinet);
};

export const deleteCabinet = async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const isDeleted = await DiningCabinetService.delete(id);

    if (!isDeleted) {
        throw new AppError("Không tìm thấy tủ để xóa", 404);
    }

    return SuccessResponse(res, 200, "Đã xóa tủ thành công!", null);
};
