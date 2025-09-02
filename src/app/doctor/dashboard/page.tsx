"use client";

import { ProtectedRoute } from "@/components/protected-route";
import { DashboardLayout } from "@/components/dashboard-layout";
import { DoctorAppointmentsList } from "@/components/doctor/appointments-list";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/components/auth-provider";
import { Calendar, Users, Clock, CheckCircle } from "lucide-react";
import { useDoctorAppointments } from "@/lib/queries";

export default function DoctorDashboard() {
  const { user } = useAuth();

  // Get stats for different appointment statuses
  const { data: allAppointments } = useDoctorAppointments({ limit: 1000 });
  const { data: pendingAppointments } = useDoctorAppointments({
    status: "PENDING",
    limit: 1000,
  });
  const { data: completedAppointments } = useDoctorAppointments({
    status: "COMPLETED",
    limit: 1000,
  });

  const stats = {
    total: allAppointments?.pagination?.total || 0,
    pending: pendingAppointments?.pagination?.total || 0,
    completed: completedAppointments?.pagination?.total || 0,
  };

  return (
    <ProtectedRoute allowedRoles={["DOCTOR"]}>
      <DashboardLayout>
        <div className="space-y-6">
          {/* Welcome Section */}
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Welcome, Dr. {user?.name}!
            </h1>
            <p className="text-gray-600">
              Manage your appointments and patient interactions.
            </p>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Calendar className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Total Appointments</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {stats.total}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-yellow-100 rounded-lg">
                    <Clock className="h-6 w-6 text-yellow-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Pending</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {stats.pending}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <CheckCircle className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Completed</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {stats.completed}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Users className="h-6 w-6 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Specialization</p>
                    <p className="text-lg font-bold text-gray-900">
                      {user?.specialization}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Appointments Management */}
          <Card>
            <CardHeader>
              <CardTitle>Manage Appointments</CardTitle>
            </CardHeader>
            <CardContent>
              <DoctorAppointmentsList />
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
