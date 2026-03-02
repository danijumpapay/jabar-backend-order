import { Logger } from "pino";

declare global {
    namespace Express {
        interface Request {
            log?: Logger;
            currentUser?: {
                id: string;
                role: string;
                username: string;
                email: string;
                name: string;
                isVerified: string;
            };
        }
    }
}

export { };
