"use client";

import { ProtectedRoute } from "@/components/protected-route";
import { DashboardLayout } from "@/components/dashboard-layout";
import { DoctorList } from "@/components/patient/doctor-list";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/components/auth-provider";
import { Calendar, Users, Clock } from "lucide-react";

export default function PatientDashboard() {
  const { user } = useAuth();

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
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Users className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Available Doctors</p>
                    <p className="text-2xl font-bold text-gray-900">50+</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Calendar className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Specializations</p>
                    <p className="text-2xl font-bold text-gray-900">10+</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <Clock className="h-6 w-6 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Quick Booking</p>
                    <p className="text-2xl font-bold text-gray-900">24/7</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Doctor List Section */}
          <Card>
            <CardHeader>
              <CardTitle>Find & Book with Doctors</CardTitle>
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
