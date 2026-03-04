import { Request, Response } from "express";
import jwt from "jsonwebtoken";

const TOKEN_SECRET = process.env.TOKEN_SECRET || "";
const TOKEN_EXPIRY = "30m";

export const issueToken = (_req: Request, res: Response): void => {
    if (!TOKEN_SECRET) {
        res.status(500).json({ success: false, message: "Server misconfiguration." });
        return;
    }
    const token = jwt.sign({ type: "client" }, TOKEN_SECRET, { expiresIn: TOKEN_EXPIRY });
    res.status(200).json({ success: true, token, expiresIn: 1800 });
};
