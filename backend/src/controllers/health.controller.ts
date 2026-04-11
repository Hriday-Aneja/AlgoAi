import { Request, Response } from 'express';

/**
 * GET /api/health
 * Returns a simple health check response to confirm the server is running.
 */
export const getHealth = (_req: Request, res: Response): void => {
  res.status(200).json({
    status: 'ok',
    message: 'Server running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  });
};
