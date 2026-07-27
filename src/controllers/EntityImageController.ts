import { Response } from "express";
import { EntityImageService } from "../services/EntityImageService";
import { idParamSchema } from "../schemas/diningSchemas";
import { emitDiningChanged, type DiningEntityType } from "../realtime/io";
import { AuthRequest } from "../types/auth";
import { AppError } from "../utils/AppError";
import { SuccessResponse } from "../utils/SuccessResponse";

export function makeImageControllers(entityType: DiningEntityType) {
    const upload = async (req: AuthRequest, res: Response) => {
        const { id } = idParamSchema.parse(req.params);
        if (!req.file) {
            throw new AppError("Thiếu file ảnh (field name: image)", 400);
        }

        const updated = await EntityImageService.upload(entityType, id, req.file);
        emitDiningChanged({
            entityType,
            action: "update",
            entityId: id,
            actorId: req.user!.id,
            actorEmail: req.user!.email,
        });
        return SuccessResponse(res, 200, "Upload ảnh thành công (đang nén thumbnail nền)", updated);
    };

    const remove = async (req: AuthRequest, res: Response) => {
        const { id } = idParamSchema.parse(req.params);
        const updated = await EntityImageService.remove(entityType, id);
        emitDiningChanged({
            entityType,
            action: "update",
            entityId: id,
            actorId: req.user!.id,
            actorEmail: req.user!.email,
        });
        return SuccessResponse(res, 200, "Đã xóa ảnh", updated);
    };

    return { upload, remove };
}
