import { Logger } from "pino";

interface UserPayload {
  id: string;
  role: string;
  username: string;
  email: string;
  name: string;
  isVerified: string;
}

declare global {
  namespace Express {
    interface Request {
      log?: Logger;
      currentUser?: UserPayload;
    }
  }
}

export {};
