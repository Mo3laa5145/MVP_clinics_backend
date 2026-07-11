import { Prisma, Patient, Visit, Appointment, Role } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { HttpError } from '../utils/httpError';
import { UserContext } from '../utils/auth';

export interface CreatePatientData {
  firstName: string;
  lastName: string;
  birthDate: string;
  gender: 'MALE' | 'FEMALE';
  phone: string;
  email?: string;
  address?: string;
  notes?: string;
  doctorId?: string | null;
}

export interface UpdatePatientData {
  firstName?: string;
  lastName?: string;
  birthDate?: string;
  gender?: 'MALE' | 'FEMALE';
  phone?: string;
  email?: string | null;
  address?: string | null;
  notes?: string | null;
  doctorId?: string | null;
}

class PatientService {
  private async findPatientWithClinic(patientId: string, clinicId: string) {
    const patient = await prisma.patient.findFirst({
      where: { id: patientId, clinicId },
    });
    return patient;
  }

  private ensureDoctorAccess(user: UserContext, patient: Patient | null): Patient {
    if (!patient) {
      throw new HttpError(404, 'Patient not found');
    }
    if (user.role === Role.DOCTOR && patient.doctorId !== user.id) {
      throw new HttpError(403, 'Forbidden');
    }
    return patient;
  }

  private async validateDoctorAssignment(clinicId: string, doctorId: string | null | undefined) {
    if (!doctorId) {
      return null;
    }

    const doctor = await prisma.user.findFirst({
      where: { id: doctorId, clinicId, role: Role.DOCTOR },
      select: { id: true },
    });

    if (!doctor) {
      throw new HttpError(400, 'doctorId is invalid');
    }

    return doctor.id;
  }

  public async listPatients(user: UserContext): Promise<Patient[]> {
    const where: Prisma.PatientWhereInput = { clinicId: user.clinicId };
    if (user.role === Role.DOCTOR) {
      where.doctorId = user.id;
    }

    const patients = await prisma.patient.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    return patients;
  }

  public async getPatientById(user: UserContext, patientId: string): Promise<Patient> {
    const patient = this.ensureDoctorAccess(user, await this.findPatientWithClinic(patientId, user.clinicId));
    return patient;
  }

  public async searchPatients(user: UserContext, query: string): Promise<Patient[]> {
    const q = query.trim();
    if (!q) {
      throw new HttpError(400, 'q is required');
    }

    const where: Prisma.PatientWhereInput = {
      clinicId: user.clinicId,
      OR: [
        { firstName: { contains: q, mode: 'insensitive' } },
        { lastName: { contains: q, mode: 'insensitive' } },
        { phone: { contains: q, mode: 'insensitive' } },
      ],
    };
    if (user.role === Role.DOCTOR) {
      where.doctorId = user.id;
    }

    const patients = await prisma.patient.findMany({
      where,
      take: 20,
      orderBy: { createdAt: 'desc' },
    });

    return patients;
  }

  public async createPatient(user: UserContext, data: CreatePatientData): Promise<Patient> {
    const birth = new Date(data.birthDate);
    if (Number.isNaN(birth.getTime())) {
      throw new HttpError(400, 'birthDate is invalid');
    }

    let doctorId: string | null | undefined = data.doctorId ?? null;
    if (user.role === Role.DOCTOR) {
      doctorId = user.id;
    } else {
      doctorId = await this.validateDoctorAssignment(user.clinicId, doctorId);
    }

    const created = await prisma.patient.create({
      data: {
        clinicId: user.clinicId,
        doctorId: doctorId ?? null,
        firstName: data.firstName,
        lastName: data.lastName,
        birthDate: birth,
        gender: data.gender,
        phone: data.phone,
        email: data.email ?? null,
        address: data.address ?? null,
        notes: data.notes ?? null,
      },
    });

    return created;
  }

  public async updatePatient(user: UserContext, patientId: string, data: UpdatePatientData): Promise<Patient> {
    this.ensureDoctorAccess(user, await this.findPatientWithClinic(patientId, user.clinicId));

    const updateData: Prisma.PatientUncheckedUpdateInput = {};
    if (data.firstName !== undefined) updateData.firstName = data.firstName;
    if (data.lastName !== undefined) updateData.lastName = data.lastName;
    if (data.birthDate !== undefined) {
      const d = new Date(data.birthDate);
      if (Number.isNaN(d.getTime())) throw new HttpError(400, 'birthDate is invalid');
      updateData.birthDate = d;
    }
    if (data.gender !== undefined) updateData.gender = data.gender;
    if (data.phone !== undefined) updateData.phone = data.phone;
    if (data.email !== undefined) updateData.email = data.email;
    if (data.address !== undefined) updateData.address = data.address;
    if (data.notes !== undefined) updateData.notes = data.notes;

    if (data.doctorId !== undefined) {
      if (user.role === Role.DOCTOR) {
        if (data.doctorId !== user.id) {
          throw new HttpError(403, 'Forbidden');
        }
        updateData.doctorId = user.id;
      } else {
        updateData.doctorId = await this.validateDoctorAssignment(user.clinicId, data.doctorId);
      }
    }

    const updated = await prisma.patient.update({
      where: { id: patientId },
      data: updateData,
    });

    return updated;
  }

  public async deletePatient(user: UserContext, patientId: string): Promise<{ success: true }> {
    if (user.role !== Role.ADMIN) {
      throw new HttpError(403, 'Forbidden');
    }

    this.ensureDoctorAccess(user, await this.findPatientWithClinic(patientId, user.clinicId));

    await prisma.$transaction([
      prisma.visit.deleteMany({ where: { patientId } }),
      prisma.appointment.deleteMany({ where: { patientId } }),
      prisma.patient.delete({ where: { id: patientId } }),
    ]);
    return { success: true };
  }

  public async getPatientHistory(user: UserContext, patientId: string): Promise<{
    patient: Patient;
    visits: Visit[];
    futureAppointments: Appointment[];
  }> {
    const patient = this.ensureDoctorAccess(user, await this.findPatientWithClinic(patientId, user.clinicId));

    const visits = await prisma.visit.findMany({
      where: { patientId: patient.id },
      orderBy: { visitDate: 'desc' },
    });

    const now = new Date();
    const futureAppointments = await prisma.appointment.findMany({
      where: { patientId: patient.id, appointmentDate: { gte: now } },
      orderBy: { appointmentDate: 'asc' },
    });

    return { patient, visits, futureAppointments };
  }
}

export const patientService = new PatientService();
