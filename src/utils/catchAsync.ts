import { Request, Response, NextFunction } from "express";

// Hàm Wrapper hứng mọi lỗi promise/async và ném nó sang cho hàm NextFunction xử lý
export const catchAsync = (fn: Function) => {
    return (req: Request, res: Response, next: NextFunction) => {
        fn(req, res, next).catch(next);
    };
};
