import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { doctorAPI, appointmentAPI } from "./localData";
import { DoctorFilters, AppointmentFilters } from "@/types";

// Query keys
export const queryKeys = {
  doctors: (params?: DoctorFilters) => ["doctors", params],
  specializations: () => ["specializations"],
  patientAppointments: (params?: AppointmentFilters) => [
    "appointments",
    "patient",
    params,
  ],
  doctorAppointments: (params?: AppointmentFilters) => [
    "appointments",
    "doctor",
    params,
  ],
};

// Doctor queries
export const useDoctors = (params?: DoctorFilters) => {
  return useQuery({
    queryKey: queryKeys.doctors(params),
    queryFn: () => doctorAPI.getAll(params),
    staleTime: 0, // Always consider data stale to ensure fresh fetches after registration
    gcTime: 0, // Don't cache data - always fetch fresh
  });
};

export const useSpecializations = () => {
  return useQuery({
    queryKey: queryKeys.specializations(),
    queryFn: async () => {
      const response = await fetch("/api/specializations");
      if (!response.ok) {
        throw new Error("Failed to fetch specializations");
      }
      return response.json();
    },
    staleTime: 30 * 60 * 1000, // 30 minutes
  });
};

// Appointment queries
export const usePatientAppointments = (params?: AppointmentFilters) => {
  return useQuery({
    queryKey: queryKeys.patientAppointments(params),
    queryFn: () => appointmentAPI.getPatientAppointments(params),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

export const useDoctorAppointments = (params?: AppointmentFilters) => {
  return useQuery({
    queryKey: queryKeys.doctorAppointments(params),
    queryFn: () => appointmentAPI.getDoctorAppointments(params),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

// Appointment mutations
export const useCreateAppointment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: appointmentAPI.create,
    onSuccess: () => {
      // Invalidate patient appointments to refetch
      queryClient.invalidateQueries({ queryKey: ["appointments", "patient"] });
      queryClient.invalidateQueries({ queryKey: ["appointments", "doctor"] });
    },
  });
};

export const useUpdateAppointmentStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      appointmentId,
      status,
    }: {
      appointmentId: string;
      status: string;
    }) => appointmentAPI.updateStatus(appointmentId, status),
    onSuccess: () => {
      // Invalidate all appointment queries to refetch
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
    },
  });
};

export const useCancelAppointment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: appointmentAPI.cancel,
    onSuccess: () => {
      // Invalidate all appointment queries to refetch
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
    },
  });
};

// TODO: User registration is now handled via MongoDB API routes
// You can create new mutations here that call /api/register and /api/login directly
