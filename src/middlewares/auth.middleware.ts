import { NextFunction, Request, Response } from "express";

export const protect = async (req: Request, res: Response, next: NextFunction) => {
    const { userId } = req.auth() as { userId: string };
    if (!userId) {
        return res.status(401).json({
            success: false,
            message: "Not authorized - login required",
        });
    }

    req.userId = userId;

    next();
};


export const adminOnly = async (req: Request, res: Response, next: NextFunction) => {
    const { userId } = req.auth() as { userId: string };
    console.log(userId);

    const isAdmin: boolean = String(userId) === String(process.env.ADMIN_ID);
    if (!isAdmin) {
        return res.status(401).json({
            success: false,
            message: "Not authorized",
        });
    }

    next();
};  