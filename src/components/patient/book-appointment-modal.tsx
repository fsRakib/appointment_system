"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Calendar, User, CheckCircle } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCreateAppointment } from "@/lib/queries";
import { AppointmentFormData, appointmentSchema } from "@/lib/schemas";
import { useAuth } from "@/components/auth-provider";
import { Doctor } from "@/types";

interface BookAppointmentModalProps {
  open: boolean;
  onClose: () => void;
  doctor: Doctor;
}

export function BookAppointmentModal({
  open,
  onClose,
  doctor,
}: BookAppointmentModalProps) {
  const [isSuccess, setIsSuccess] = useState(false);
  const createAppointmentMutation = useCreateAppointment();
  const { user, isAuthenticated } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm<AppointmentFormData>({
    resolver: zodResolver(appointmentSchema),
    defaultValues: {
      doctorId: doctor?.id || "",
      date: "",
    },
  });

  // Update doctorId when doctor prop changes
  useEffect(() => {
    if (doctor?.id) {
      setValue("doctorId", doctor.id);
    }
  }, [doctor?.id, setValue]);

  const onSubmit = async (data: AppointmentFormData) => {
    console.log("Form submitted with data:", data);
    console.log("Doctor:", doctor);
    console.log("Current user:", user);
    console.log("Is authenticated:", isAuthenticated);

    // Check authentication before proceeding
    if (!isAuthenticated || !user) {
      alert("Please log in to book an appointment");
      return;
    }

    // Validate form data
    if (!data.doctorId || !data.date) {
      alert("Please fill in all required fields");
      return;
    }

    // Validate doctor exists
    if (!doctor || doctor.id !== data.doctorId) {
      alert("Invalid doctor selection");
      return;
    }

    try {
      const result = await createAppointmentMutation.mutateAsync({
        doctorId: data.doctorId,
        date: data.date,
      });
      console.log("Appointment created successfully:", result);
      setIsSuccess(true);
      setTimeout(() => {
        setIsSuccess(false);
        onClose();
        reset();
      }, 2000);
    } catch (error) {
      console.error("Failed to book appointment:", error);
      let errorMessage = "Failed to book appointment. Please try again.";

      if (error instanceof Error) {
        if (error.message.includes("User not authenticated")) {
          errorMessage = "Please log in to book an appointment.";
        } else if (error.message.includes("Date")) {
          errorMessage = "Please select a valid date (tomorrow or later).";
        } else {
          errorMessage = error.message;
        }
      }

      alert(errorMessage);
    }
  };

  const handleClose = () => {
    if (createAppointmentMutation.isPending) {
      return; // Prevent closing while request is in progress
    }
    setIsSuccess(false);
    onClose();
    reset();
  };

  if (!doctor) return null;

  // Get tomorrow's date as minimum selectable date
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split("T")[0];

  return (
    <Modal open={open} onClose={handleClose} title="Book Appointment" size="md">
      {isSuccess ? (
        <div className="text-center py-8">
          <CheckCircle className="mx-auto h-16 w-16 text-green-500 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Appointment Booked Successfully!
          </h3>
          <p className="text-gray-600">
            Your appointment with {doctor.name} has been scheduled. You will
            receive a confirmation shortly.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Doctor Info */}
          <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
            {doctor.photo_url ? (
              <img
                src={doctor.photo_url}
                alt={doctor.name}
                className="w-12 h-12 rounded-full object-cover"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                <User size={24} className="text-blue-600" />
              </div>
            )}
            <div>
              <h3 className="font-semibold text-gray-900">{doctor.name}</h3>
              <p className="text-blue-600 text-sm">{doctor.specialization}</p>
            </div>
          </div>

          {/* Appointment Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <input type="hidden" {...register("doctorId")} value={doctor.id} />

            <Input
              label="Select Date"
              type="date"
              min={minDate}
              {...register("date", { required: "Please select a date" })}
              error={errors.date?.message}
            />

            <div className="flex justify-end space-x-3 pt-4">
              <Button type="button" variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button
                type="submit"
                loading={createAppointmentMutation.isPending}
                disabled={createAppointmentMutation.isPending || !doctor?.id}
              >
                <Calendar className="mr-2 h-4 w-4" />
                Book Appointment
              </Button>
            </div>
          </form>
        </div>
      )}
    </Modal>
  );
}
