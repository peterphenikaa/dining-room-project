import { Response } from "express";

export const SuccessResponse = (res: Response, statusCode: number, message: string, data: any = null) => {
    return res.status(statusCode).json({
        status: "success",
        message,
        data
    });
};
