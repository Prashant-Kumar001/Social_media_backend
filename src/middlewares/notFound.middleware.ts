import { Request, Response } from "express";

export const notFound = (_req: Request, res: Response) => {
    res.status(404).json({
        success: false,
        message: "Route not found",
        route: _req.originalUrl,
        method: _req.method,
        statusCode: 404,
        data: null,
    });
};
