import { NextFunction, Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import { isHttpError } from '../utils/httpError';

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  console.error(err);

  if (isHttpError(err)) {
    return res.status(err.statusCode).json({ success: false, message: err.message });
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
    return res.status(409).json({ success: false, message: 'Resource already exists' });
  }

  if (err instanceof Error) {
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }

  return res.status(500).json({ success: false, message: 'Internal server error' });
}
