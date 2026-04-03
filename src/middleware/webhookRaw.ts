import { Request, Response, NextFunction } from 'express';

/**
 * Captures the raw body buffer for Stripe webhook signature verification.
 * Must be applied BEFORE express.json() on the webhook route.
 */
export function captureRawBody(req: Request, _res: Response, next: NextFunction) {
  const chunks: Buffer[] = [];
  req.on('data', (chunk: Buffer) => chunks.push(chunk));
  req.on('end', () => {
    (req as Request & { rawBody: Buffer }).rawBody = Buffer.concat(chunks);
    next();
  });
}

declare global {
  namespace Express {
    interface Request {
      rawBody?: Buffer;
    }
  }
}
