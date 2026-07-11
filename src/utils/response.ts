import { Response } from 'express';

export function sendSuccess(res: Response, data: unknown) {
  return res.json({ success: true, data });
}

export function sendError(res: Response, message: string, status = 400) {
  return res.status(status).json({ success: false, message });
}
