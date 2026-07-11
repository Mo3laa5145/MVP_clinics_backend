import { Role } from '@prisma/client';

export type { Role };

export interface AuthUser {
  id: string;
  clinicId: string;
  role: Role;
  passwordHash: string;
}

export interface AuthPayload {
  sub: string;
  role: Role;
  clinicId: string;
  doctorId?: string | null;
}
