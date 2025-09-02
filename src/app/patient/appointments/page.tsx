"use client";

import { ProtectedRoute } from "@/components/protected-route";
import { DashboardLayout } from "@/components/dashboard-layout";
import { AppointmentsList } from "@/components/patient/appointments-list";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function PatientAppointments() {
  return (
    <ProtectedRoute allowedRoles={["PATIENT"]}>
      <DashboardLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              My Appointments
            </h1>
            <p className="text-gray-600">
              View and manage all your scheduled appointments.
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Your Appointments</CardTitle>
            </CardHeader>
            <CardContent>
              <AppointmentsList />
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
