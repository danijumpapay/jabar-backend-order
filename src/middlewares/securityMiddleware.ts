import rateLimit from "express-rate-limit";
import { Request, Response, NextFunction } from "express";

const rateLimitResponse = (_req: Request, res: Response) => {
    res.status(429).json({
        success: false,
        message: "Too many requests. Please try again later.",
    });
};

export const globalRateLimit = rateLimit({
    windowMs: 60 * 1000,
    max: 200,
    standardHeaders: true,
    legacyHeaders: false,
    handler: rateLimitResponse,
});

export const createOrderRateLimit = rateLimit({
    windowMs: 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    handler: rateLimitResponse,
});

export const statusCheckRateLimit = rateLimit({
    windowMs: 60 * 1000,
    max: 60,
    standardHeaders: true,
    legacyHeaders: false,
    handler: rateLimitResponse,
});

export const requireApiKey = (req: Request, res: Response, next: NextFunction) => {
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
        return next();
    }
    const provided = req.headers["x-api-key"];
    if (!provided || provided !== apiKey) {
        return res.status(401).json({ success: false, message: "Invalid or missing API key." });
    }
    next();
};
