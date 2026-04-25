import { NextFunction, Request, Response, RequestHandler } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import { AuthenticatedRequest } from "../types/express";

interface AuthTokenPayload extends JwtPayload {
  sub?: string;
  userId?: string;
}

export const requireAuth = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  const authHeader = req.header("Authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({
      status: "error",
      message: "Missing or invalid Authorization header.",
    });
    return;
  }

  const token = authHeader.slice("Bearer ".length).trim();
  const jwtSecret = process.env.JWT_SECRET;

  if (!jwtSecret) {
    next(new Error("JWT_SECRET is not configured."));
    return;
  }

  try {
    const decoded = jwt.verify(token, jwtSecret) as AuthTokenPayload;
    const userId = decoded.userId ?? decoded.sub;

    if (!userId || userId.trim().length === 0) {
      res.status(401).json({
        status: "error",
        message: "Invalid token payload: user identifier is missing.",
      });
      return;
    }

    req.auth = { userId };
    next();
  } catch {
    res.status(401).json({
      status: "error",
      message: "Invalid or expired token.",
    });
  }
};

/**
 * Wraps a request handler that expects AuthenticatedRequest
 * and returns a standard Express RequestHandler.
 * This allows TypeScript to properly type handlers used after requireAuth middleware.
 */
export const withAuth = (
  handler: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void> | void
): RequestHandler => {
  return (req: Request, res: Response, next: NextFunction) => {
    return handler(req as AuthenticatedRequest, res, next);
  };
};
