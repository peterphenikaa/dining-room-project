import { Response } from "express";
import { DiningRoomService } from "../services/DiningRoomService";
import { cursorPaginationQuerySchema } from "../schemas/paginationSchemas";
import { emitDiningChanged } from "../realtime/io";
import { AuthRequest } from "../types/auth";
import { AppError } from "../utils/AppError";
import { SuccessResponse } from "../utils/SuccessResponse";

export const createRoom = async (req: AuthRequest, res: Response) => {
    const { name, area_size, style } = req.body;

    if (!name || !area_size) {
        throw new AppError("Tên phòng và diện tích là bắt buộc", 400);
    }

    const newRoom = await DiningRoomService.create({ name, area_size, style });
    emitDiningChanged({
        entityType: "room",
        action: "create",
        entityId: newRoom.id,
        actorId: req.user!.id,
        actorEmail: req.user!.email,
    });
    return SuccessResponse(res, 201, "Tạo phòng ăn thành công!", newRoom);
};

export const getAllRooms = async (req: AuthRequest, res: Response) => {
    const query = cursorPaginationQuerySchema.parse(req.query);
    const page = await DiningRoomService.getAll(query);
    return SuccessResponse(res, 200, "Lấy danh sách phòng ăn thành công", page);
};

export const getRoomById = async (req: AuthRequest, res: Response) => {
    const id = req.params.id as string;
    const room = await DiningRoomService.getById(id);

    if (!room) {
        throw new AppError("Không tìm thấy phòng ăn", 404);
    }

    return SuccessResponse(res, 200, "Lấy dữ liệu thành công", room);
};

export const updateRoom = async (req: AuthRequest, res: Response) => {
    const id = req.params.id as string;
    const updatedRoom = await DiningRoomService.update(id, req.body);

    if (!updatedRoom) {
        throw new AppError("Không tìm thấy phòng ăn để sửa", 404);
    }

    emitDiningChanged({
        entityType: "room",
        action: "update",
        entityId: updatedRoom.id,
        actorId: req.user!.id,
        actorEmail: req.user!.email,
    });
    return SuccessResponse(res, 200, "Cập nhật thành công!", updatedRoom);
};

export const deleteRoom = async (req: AuthRequest, res: Response) => {
    const id = req.params.id as string;
    const isDeleted = await DiningRoomService.delete(id);

    if (!isDeleted) {
        throw new AppError("Không tìm thấy phòng ăn để xóa", 404);
    }

    emitDiningChanged({
        entityType: "room",
        action: "delete",
        entityId: id,
        actorId: req.user!.id,
        actorEmail: req.user!.email,
    });
    return SuccessResponse(res, 200, "Đã xóa phòng ăn thành công!", null);
};
