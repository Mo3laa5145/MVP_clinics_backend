import { Prisma, Role, Visit } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { UserContext } from '../utils/auth';
import { HttpError } from '../utils/httpError';

export interface VisitData {
  patientId?: string;
  doctorId?: string;
  visitDate?: string;
  chiefComplaint?: string;
  diagnosis?: string | null;
  treatment?: string | null;
  bloodPressure?: string | null;
  heartRate?: string | null;
  temperature?: string | null;
  doctorNotes?: string | null;
  followUpDate?: string | null;
}

class VisitService {
  private parseDate(value: string | null | undefined, field: string, required = false) {
    if (value === null || value === undefined) {
      if (required) {
        throw new HttpError(400, `${field} is required`);
      }
      return value === null ? null : undefined;
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      throw new HttpError(400, `${field} is invalid`);
    }

    return date;
  }

  private async getAccessiblePatient(user: UserContext, patientId: string) {
    const patient = await prisma.patient.findFirst({
      where: { id: patientId, clinicId: user.clinicId },
      select: { id: true, doctorId: true },
    });

    if (!patient) {
      throw new HttpError(404, 'Patient not found');
    }

    if (user.role === Role.DOCTOR && patient.doctorId !== user.id) {
      throw new HttpError(403, 'Forbidden');
    }

    return patient;
  }

  private async getClinicDoctor(user: UserContext, doctorId: string) {
    const doctor = await prisma.user.findFirst({
      where: { id: doctorId, clinicId: user.clinicId, role: Role.DOCTOR },
      select: { id: true },
    });

    if (!doctor) {
      throw new HttpError(400, 'doctorId is invalid');
    }

    return doctor;
  }

  private async getAccessibleVisit(user: UserContext, visitId: string) {
    const visit = await prisma.visit.findFirst({
      where: {
        id: visitId,
        patient: { clinicId: user.clinicId },
      },
      include: {
        patient: { select: { id: true, clinicId: true, doctorId: true } },
      },
    });

    if (!visit) {
      throw new HttpError(404, 'Visit not found');
    }

    if (user.role === Role.DOCTOR && (visit.doctorId !== user.id || visit.patient.doctorId !== user.id)) {
      throw new HttpError(403, 'Forbidden');
    }

    return visit;
  }

  async createVisit(user: UserContext, data: VisitData): Promise<Visit> {
    if (!data.patientId) {
      throw new HttpError(400, 'patientId is required');
    }
    if (!data.chiefComplaint?.trim()) {
      throw new HttpError(400, 'chiefComplaint is required');
    }

    const patient = await this.getAccessiblePatient(user, data.patientId);
    const requestedDoctorId = user.role === Role.DOCTOR ? user.id : data.doctorId ?? patient.doctorId;
    if (!requestedDoctorId) {
      throw new HttpError(400, 'doctorId is required');
    }

    const doctor = await this.getClinicDoctor(user, requestedDoctorId);
    if (user.role === Role.DOCTOR && doctor.id !== user.id) {
      throw new HttpError(403, 'Forbidden');
    }

    return prisma.visit.create({
      data: {
        patientId: patient.id,
        doctorId: doctor.id,
        visitDate: this.parseDate(data.visitDate, 'visitDate', true) as Date,
        chiefComplaint: data.chiefComplaint.trim(),
        diagnosis: data.diagnosis ?? null,
        treatment: data.treatment ?? null,
        bloodPressure: data.bloodPressure ?? null,
        heartRate: data.heartRate ?? null,
        temperature: data.temperature ?? null,
        doctorNotes: data.doctorNotes ?? null,
        followUpDate: this.parseDate(data.followUpDate, 'followUpDate') as Date | null | undefined,
      },
    });
  }

  async updateVisit(user: UserContext, visitId: string, data: VisitData): Promise<Visit> {
    await this.getAccessibleVisit(user, visitId);

    const updateData: Prisma.VisitUncheckedUpdateInput = {};
    if (data.patientId !== undefined) {
      const patient = await this.getAccessiblePatient(user, data.patientId);
      updateData.patientId = patient.id;
    }
    if (data.doctorId !== undefined) {
      if (user.role === Role.DOCTOR && data.doctorId !== user.id) {
        throw new HttpError(403, 'Forbidden');
      }
      updateData.doctorId = (await this.getClinicDoctor(user, data.doctorId)).id;
    }
    if (data.visitDate !== undefined) updateData.visitDate = this.parseDate(data.visitDate, 'visitDate') as Date;
    if (data.chiefComplaint !== undefined) {
      if (!data.chiefComplaint.trim()) {
        throw new HttpError(400, 'chiefComplaint is invalid');
      }
      updateData.chiefComplaint = data.chiefComplaint.trim();
    }
    if (data.diagnosis !== undefined) updateData.diagnosis = data.diagnosis;
    if (data.treatment !== undefined) updateData.treatment = data.treatment;
    if (data.bloodPressure !== undefined) updateData.bloodPressure = data.bloodPressure;
    if (data.heartRate !== undefined) updateData.heartRate = data.heartRate;
    if (data.temperature !== undefined) updateData.temperature = data.temperature;
    if (data.doctorNotes !== undefined) updateData.doctorNotes = data.doctorNotes;
    if (data.followUpDate !== undefined) updateData.followUpDate = this.parseDate(data.followUpDate, 'followUpDate') as Date | null;

    return prisma.visit.update({
      where: { id: visitId },
      data: updateData,
    });
  }

  async deleteVisit(user: UserContext, visitId: string) {
    await this.getAccessibleVisit(user, visitId);
    await prisma.visit.delete({ where: { id: visitId } });
    return { success: true };
  }

  async getVisitHistory(user: UserContext, patientId: string): Promise<Visit[]> {
    const patient = await this.getAccessiblePatient(user, patientId);
    return prisma.visit.findMany({
      where: { patientId: patient.id },
      orderBy: { visitDate: 'desc' },
    });
  }
}

export const visitService = new VisitService();
