import "express";
import { Request } from "express";

declare global {
  namespace Express {
    interface Request {
      auth?: {
        userId: string;
      };
    }
  }
}

// AuthenticatedRequest is used after requireAuth middleware
// The middleware ensures auth is always defined, but TypeScript can't know this
// So we use a type that tells TypeScript auth is required
export type AuthenticatedRequest = Request & {
  auth: {
    userId: string;
  };
};
