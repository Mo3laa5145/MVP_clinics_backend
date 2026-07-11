import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import { authenticate, AuthenticatedRequest } from '../middleware/auth';
import { sendError, sendSuccess } from '../utils/response';

const router = Router();

router.post('/register', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { clinicName, email, password } = req.body;

    if (!clinicName || !email || !password) {
      return sendError(res, 'clinicName, email, and password are required');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const fullName = req.body.fullName || email.split('@')[0];

    const user = await prisma.$transaction(async (tx) => {
      const clinic = await tx.clinic.create({
        data: { name: clinicName.trim() },
        select: { id: true },
      });

      return tx.user.create({
        data: {
          clinicId: clinic.id,
          fullName: String(fullName).trim(),
          email: String(email).trim().toLowerCase(),
          passwordHash: hashedPassword,
          role: 'ADMIN',
        },
        select: { id: true, clinicId: true, role: true },
      });
    });

    const token = jwt.sign(
      { sub: user.id, role: user.role, clinicId: user.clinicId, doctorId: user.role === 'DOCTOR' ? user.id : null },
      env.jwtSecret,
      { expiresIn: '7d' }
    );

    sendSuccess(res, { token, user: { id: user.id, clinicId: user.clinicId, role: user.role } });
  } catch (error: unknown) {
    next(error);
  }
});

router.post('/login', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return sendError(res, 'email and password are required');
    }

    const user = await prisma.user.findUnique({
      where: { email: String(email).trim().toLowerCase() },
      select: { id: true, clinicId: true, role: true, passwordHash: true },
    });

    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      return sendError(res, 'Invalid credentials', 401);
    }

    const token = jwt.sign(
      { sub: user.id, role: user.role, clinicId: user.clinicId, doctorId: user.role === 'DOCTOR' ? user.id : null },
      env.jwtSecret,
      { expiresIn: '7d' }
    );

    sendSuccess(res, { token, user: { id: user.id, clinicId: user.clinicId, role: user.role } });
  } catch (error) {
    next(error);
  }
});

router.get('/me', authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return sendError(res, 'Authentication required', 401);
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { id: true, clinicId: true, role: true, email: true },
    });

    if (!user || user.clinicId !== req.user.clinicId || user.role !== req.user.role) {
      return sendError(res, 'User not found', 404);
    }

    sendSuccess(res, { user });
  } catch (error) {
    next(error);
  }
});

export default router;
