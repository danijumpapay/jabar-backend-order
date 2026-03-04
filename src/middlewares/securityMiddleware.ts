import rateLimit from "express-rate-limit";
import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

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

export const tokenRateLimit = rateLimit({
    windowMs: 60 * 1000,
    max: 5,
    standardHeaders: true,
    legacyHeaders: false,
    handler: rateLimitResponse,
});

export const requireDynamicToken = (req: Request, res: Response, next: NextFunction) => {
    const excluded = ["/", "/api/v1/auth/token"];
    if (excluded.some(p => req.path === p || req.originalUrl === p)) return next();

    const tokenSecret = process.env.TOKEN_SECRET || "";
    if (!tokenSecret) return next();

    const authHeader = req.headers["authorization"];
    const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;

    if (!token) {
        return res.status(401).json({ success: false, message: "Authorization token required." });
    }

    try {
        jwt.verify(token, tokenSecret);
        next();
    } catch {
        return res.status(401).json({ success: false, message: "Token invalid or expired." });
    }
};
