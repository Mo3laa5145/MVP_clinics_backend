import { NextFunction, Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { visitService, VisitData } from '../services/visit.service';
import { getUserContext } from '../utils/auth';
import { sendError, sendSuccess } from '../utils/response';

interface VisitBody {
  patientId?: unknown;
  doctorId?: unknown;
  visitDate?: unknown;
  chiefComplaint?: unknown;
  diagnosis?: unknown;
  treatment?: unknown;
  bloodPressure?: unknown;
  heartRate?: unknown;
  temperature?: unknown;
  doctorNotes?: unknown;
  followUpDate?: unknown;
}

class VisitController {
  constructor() {
    this.create = this.create.bind(this);
    this.update = this.update.bind(this);
    this.delete = this.delete.bind(this);
    this.history = this.history.bind(this);
  }

  async create(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const validationError = this.validateCreate(req.body as VisitBody);
      if (validationError) return sendError(res, validationError, 400);

      const visit = await visitService.createVisit(getUserContext(req), this.toVisitData(req.body as VisitBody));
      return sendSuccess(res, visit);
    } catch (error) {
      next(error);
    }
  }

  async update(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const validationError = this.validateUpdate(req.body as VisitBody);
      if (validationError) return sendError(res, validationError, 400);

      const visit = await visitService.updateVisit(getUserContext(req), this.param(req.params.id), this.toVisitData(req.body as VisitBody));
      return sendSuccess(res, visit);
    } catch (error) {
      next(error);
    }
  }

  async delete(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await visitService.deleteVisit(getUserContext(req), this.param(req.params.id));
      return sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  async history(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const visits = await visitService.getVisitHistory(getUserContext(req), this.param(req.params.patientId));
      return sendSuccess(res, visits);
    } catch (error) {
      next(error);
    }
  }

  private toVisitData(body: VisitBody): VisitData {
    return {
      patientId: typeof body.patientId === 'string' ? body.patientId : undefined,
      doctorId: typeof body.doctorId === 'string' ? body.doctorId : undefined,
      visitDate: typeof body.visitDate === 'string' ? body.visitDate : undefined,
      chiefComplaint: typeof body.chiefComplaint === 'string' ? body.chiefComplaint : undefined,
      diagnosis: this.optionalString(body.diagnosis),
      treatment: this.optionalString(body.treatment),
      bloodPressure: this.optionalString(body.bloodPressure),
      heartRate: this.optionalString(body.heartRate),
      temperature: this.optionalString(body.temperature),
      doctorNotes: this.optionalString(body.doctorNotes),
      followUpDate: body.followUpDate === null ? null : typeof body.followUpDate === 'string' ? body.followUpDate : undefined,
    };
  }

  private param(value: string | string[]) {
    return Array.isArray(value) ? value[0] : value;
  }

  private optionalString(value: unknown) {
    if (value === null) return null;
    return typeof value === 'string' ? value : undefined;
  }

  private validateCreate(body: VisitBody) {
    if (typeof body.patientId !== 'string' || body.patientId.trim() === '') return 'patientId is required';
    if (typeof body.visitDate !== 'string' || body.visitDate.trim() === '') return 'visitDate is required';
    if (typeof body.chiefComplaint !== 'string' || body.chiefComplaint.trim() === '') return 'chiefComplaint is required';
    return this.validateUpdate(body);
  }

  private validateUpdate(body: VisitBody) {
    const stringFields: Array<keyof VisitBody> = [
      'patientId',
      'doctorId',
      'visitDate',
      'chiefComplaint',
      'diagnosis',
      'treatment',
      'bloodPressure',
      'heartRate',
      'temperature',
      'doctorNotes',
      'followUpDate',
    ];

    for (const field of stringFields) {
      const value = body[field];
      if (value !== undefined && value !== null && typeof value !== 'string') {
        return `${field} is invalid`;
      }
    }

    return null;
  }
}

const visitController = new VisitController();
export default visitController;
