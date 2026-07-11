import { Role } from '@prisma/client';
import { AuthenticatedRequest } from '../middleware/auth';
import { HttpError } from './httpError';

export interface UserContext {
  id: string;
  clinicId: string;
  doctorId: string | null;
  role: Role;
}

export function getUserContext(req: AuthenticatedRequest): UserContext {
  if (!req.user) {
    throw new HttpError(401, 'Authentication required');
  }

  return {
    id: req.user.id,
    clinicId: req.user.clinicId,
    doctorId: req.user.doctorId,
    role: req.user.role,
  };
}

export function normalizeRole(value: unknown): Role | null {
  if (typeof value !== 'string') {
    return null;
  }

  const normalized = value.trim().toUpperCase();
  if (normalized === Role.ADMIN || normalized === Role.DOCTOR || normalized === Role.RECEPTIONIST) {
    return normalized;
  }

  return null;
}
