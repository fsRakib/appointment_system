import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(["DOCTOR", "PATIENT"]).refine((val) => val, {
    message: "Please select a role",
  }),
});

export const patientRegistrationSchema = z
  .object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Please enter a valid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string(),
    photo_url: z
      .string()
      .url("Please enter a valid URL")
      .optional()
      .or(z.literal("")),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

export const doctorRegistrationSchema = z
  .object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Please enter a valid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string(),
    specialization: z.string().min(1, "Please select a specialization"),
    photo_url: z
      .string()
      .url("Please enter a valid URL")
      .optional()
      .or(z.literal("")),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

export const appointmentSchema = z.object({
  doctorId: z.string().min(1, "Doctor is required"),
  date: z
    .string()
    .min(1, "Date is required")
    .refine((date) => {
      const selectedDate = new Date(date);
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);
      return selectedDate >= tomorrow;
    }, "Date must be tomorrow or later"),
});

export type LoginFormData = z.infer<typeof loginSchema>;
export type PatientRegistrationFormData = z.infer<
  typeof patientRegistrationSchema
>;
export type DoctorRegistrationFormData = z.infer<
  typeof doctorRegistrationSchema
>;
export type AppointmentFormData = z.infer<typeof appointmentSchema>;
