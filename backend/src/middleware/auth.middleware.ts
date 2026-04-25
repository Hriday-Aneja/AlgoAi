import { NextFunction, Request, Response } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";

interface AuthTokenPayload extends JwtPayload {
  sub?: string;
  userId?: string;
}

export const authenticateToken = (
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

    (req as any).user = { id: userId };
    next();
  } catch {
    res.status(401).json({
      status: "error",
      message: "Invalid or expired token.",
    });
  }
};