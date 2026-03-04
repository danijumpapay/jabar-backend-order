import { Router } from "express";
import { issueToken } from "@controllers/auth/auth.controller";
import { tokenRateLimit } from "@middlewares/securityMiddleware";

const router = Router();

router.get("/token", tokenRateLimit, issueToken);

export default router;
