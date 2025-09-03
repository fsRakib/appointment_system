export interface User {
  id: string;
  name: string;
  email: string;
  role: "DOCTOR" | "PATIENT";
  specialization?: string;
  photo_url?: string;
  createdAt?: string;
}

export interface Doctor extends User {
  role: "DOCTOR";
  specialization: string;
}

export interface Patient extends User {
  role: "PATIENT";
}

export interface Appointment {
  id: string;
  doctorId: string;
  patientId: string;
  date: string;
  status: "PENDING" | "CONFIRMED" | "CANCELLED" | "COMPLETED";
  notes?: string;
  createdBy: string;
  createdAt: string;
  updatedAt?: string;
  doctor?: Doctor;
  patient?: Patient;
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ApiResponse<T> {
  data: T;
  pagination?: PaginationInfo;
}

export interface DoctorFilters {
  page?: number;
  limit?: number;
  search?: string;
  specialization?: string;
}

export interface AppointmentFilters {
  page?: number;
  limit?: number;
  status?: string;
  date?: string;
  doctorId?: string;
  patientId?: string;
}
