"use client";

import { ProtectedRoute } from "@/components/protected-route";
import { DashboardLayout } from "@/components/dashboard-layout";
import { DoctorList } from "@/components/patient/doctor-list";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/components/auth-provider";
import { useParams, useRouter } from "next/navigation";
import { useEffect } from "react";

export default function PatientDashboard() {
  const { user } = useAuth();
  const params = useParams();
  const router = useRouter();
  const patientId = params.id as string;

  // Verify the patient ID matches the logged-in user
  useEffect(() => {
    if (user && user.id !== patientId) {
      // Redirect to the correct patient dashboard if IDs don't match
      router.replace(`/patient/${user.id}/dashboard`);
    }
  }, [user, patientId, router]);

  return (
    <ProtectedRoute allowedRoles={["PATIENT"]}>
      <DashboardLayout>
        <div className="space-y-6">
          {/* Welcome Section */}
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Welcome back, {user?.name}!
            </h1>
            <p className="text-gray-600">
              Find and book appointments with our experienced doctors.
            </p>
            <p className="text-sm text-gray-500 mt-1">
              Patient ID: {patientId}
            </p>
          </div>

          {/* Available Doctors - Book Appointments */}
          <Card>
            <CardHeader>
              <CardTitle>Book an Appointment</CardTitle>
              <p className="text-sm text-gray-600">
                Find and book appointments with our experienced doctors
              </p>
            </CardHeader>
            <CardContent>
              <DoctorList />
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
