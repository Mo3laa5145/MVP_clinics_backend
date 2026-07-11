import { NextFunction, Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { patientService } from '../services/patient.service';
import { getUserContext } from '../utils/auth';
import { sendError, sendSuccess } from '../utils/response';

interface PatientBody {
  firstName?: unknown;
  lastName?: unknown;
  birthDate?: unknown;
  gender?: unknown;
  phone?: unknown;
  email?: unknown;
  address?: unknown;
  notes?: unknown;
  doctorId?: unknown;
}

class PatientController {
  constructor() {
    this.list = this.list.bind(this);
    this.getById = this.getById.bind(this);
    this.search = this.search.bind(this);
    this.create = this.create.bind(this);
    this.update = this.update.bind(this);
    this.delete = this.delete.bind(this);
    this.getHistory = this.getHistory.bind(this);
  }

  async list(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userContext = getUserContext(req);
      const data = await patientService.listPatients(userContext);
      sendSuccess(res, data);
    } catch (error) {
      next(error);
    }
  }

  async getById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userContext = getUserContext(req);

      const patient = await patientService.getPatientById(userContext, Array.isArray(req.params.id) ? req.params.id[0] : req.params.id);
      sendSuccess(res, patient);
    } catch (error) {
      next(error);
    }
  }

  async search(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userContext = getUserContext(req);
      const query = req.query.q;

      if (typeof query !== 'string' || query.trim() === '') {
        return sendError(res, 'q is required', 400);
      }

      const data = await patientService.searchPatients(userContext, query);
      sendSuccess(res, data);
    } catch (error) {
      next(error);
    }
  }

  async create(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userContext = getUserContext(req);

      const body = req.body as PatientBody;
      const validationError = this.validateCreate(body);
      if (validationError) {
        return sendError(res, validationError, 400);
      }

      const data = await patientService.createPatient(userContext, {
        firstName: body.firstName as string,
        lastName: body.lastName as string,
        birthDate: body.birthDate as string,
        gender: body.gender as 'MALE' | 'FEMALE',
        phone: body.phone as string,
        email: typeof body.email === 'string' ? body.email : undefined,
        address: typeof body.address === 'string' ? body.address : undefined,
        notes: typeof body.notes === 'string' ? body.notes : undefined,
        doctorId: typeof body.doctorId === 'string' ? body.doctorId : undefined,
      });

      sendSuccess(res, data);
    } catch (error) {
      next(error);
    }
  }

  async update(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userContext = getUserContext(req);

      const body = req.body as PatientBody;
      const validationError = this.validateUpdate(body);
      if (validationError) {
        return sendError(res, validationError, 400);
      }

      const data = await patientService.updatePatient(userContext, Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, {
        firstName: typeof body.firstName === 'string' ? body.firstName : undefined,
        lastName: typeof body.lastName === 'string' ? body.lastName : undefined,
        birthDate: typeof body.birthDate === 'string' ? body.birthDate : undefined,
        gender: body.gender as 'MALE' | 'FEMALE' | undefined,
        phone: typeof body.phone === 'string' ? body.phone : undefined,
        email: typeof body.email === 'string' ? body.email : undefined,
        address: typeof body.address === 'string' ? body.address : undefined,
        notes: typeof body.notes === 'string' ? body.notes : undefined,
        doctorId: typeof body.doctorId === 'string' ? body.doctorId : undefined,
      });

      sendSuccess(res, data);
    } catch (error) {
      next(error);
    }
  }

  async delete(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userContext = getUserContext(req);

      const result = await patientService.deletePatient(userContext, Array.isArray(req.params.id) ? req.params.id[0] : req.params.id);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  async getHistory(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userContext = getUserContext(req);

      const data = await patientService.getPatientHistory(userContext, Array.isArray(req.params.id) ? req.params.id[0] : req.params.id);
      sendSuccess(res, data);
    } catch (error) {
      next(error);
    }
  }

  private validateCreate(body: PatientBody) {
    if (typeof body.firstName !== 'string' || body.firstName.trim() === '') {
      return 'firstName is required';
    }
    if (typeof body.lastName !== 'string' || body.lastName.trim() === '') {
      return 'lastName is required';
    }
    if (typeof body.birthDate !== 'string' || body.birthDate.trim() === '') {
      return 'birthDate is required';
    }
    if (typeof body.phone !== 'string' || body.phone.trim() === '') {
      return 'phone is required';
    }
    if (body.gender !== 'MALE' && body.gender !== 'FEMALE') {
      return 'gender must be MALE or FEMALE';
    }
    return null;
  }

  private validateUpdate(body: PatientBody) {
    if (body.firstName !== undefined && (typeof body.firstName !== 'string' || body.firstName.trim() === '')) {
      return 'firstName is invalid';
    }
    if (body.lastName !== undefined && (typeof body.lastName !== 'string' || body.lastName.trim() === '')) {
      return 'lastName is invalid';
    }
    if (body.birthDate !== undefined && (typeof body.birthDate !== 'string' || body.birthDate.trim() === '')) {
      return 'birthDate is invalid';
    }
    if (body.phone !== undefined && (typeof body.phone !== 'string' || body.phone.trim() === '')) {
      return 'phone is invalid';
    }
    if (body.gender !== undefined && body.gender !== 'MALE' && body.gender !== 'FEMALE') {
      return 'gender must be MALE or FEMALE';
    }
    return null;
  }
}

const patientController = new PatientController();
export default patientController;
