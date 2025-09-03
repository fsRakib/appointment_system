"use client";

import { useState, useEffect } from "react";
import { Search, Calendar, User, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Loading, EmptyState } from "@/components/ui/loading";
import { useDoctors, useSpecializations } from "@/lib/queries";
import { BookAppointmentModal } from "./book-appointment-modal";
import { Doctor } from "@/types";
import { eventBus, EVENTS } from "@/lib/events";

export function DoctorList() {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSpecialization, setSelectedSpecialization] = useState("");
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [showBookingModal, setShowBookingModal] = useState(false);

  const {
    data: doctorsData,
    isLoading,
    refetch,
  } = useDoctors({
    page: currentPage,
    limit: 6,
    search: searchTerm,
    specialization: selectedSpecialization,
  });

  // Force refetch when search or filters change
  useEffect(() => {
    refetch();
  }, [searchTerm, selectedSpecialization, currentPage, refetch]);

  const { data: specializations } = useSpecializations();

  // Listen for doctor registration events
  useEffect(() => {
    const handleDoctorRegistered = (newDoctor: unknown) => {
      console.log("New doctor registered event received:", newDoctor);
      // Force refetch of doctors immediately
      setTimeout(() => {
        refetch();
      }, 100);
    };

    eventBus.on(EVENTS.DOCTOR_REGISTERED, handleDoctorRegistered);

    return () => {
      eventBus.off(EVENTS.DOCTOR_REGISTERED, handleDoctorRegistered);
    };
  }, [refetch]);

  const handleBookAppointment = (doctor: Doctor) => {
    console.log("Booking appointment for doctor:", doctor);
    setSelectedDoctor(doctor);
    setShowBookingModal(true);
  };

  if (isLoading) {
    return <Loading text="Loading doctors..." />;
  }

  const doctors = doctorsData?.data || [];
  const pagination = doctorsData?.pagination || { totalPages: 1 };

  return (
    <div className="space-y-6">
      {/* Search and Filter */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                  size={20}
                />
                <Input
                  placeholder="Search doctors by name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="md:w-64">
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={selectedSpecialization}
                onChange={(e) => setSelectedSpecialization(e.target.value)}
              >
                <option value="">All Specializations</option>
                {specializations?.data?.map((spec: string) => (
                  <option key={spec} value={spec}>
                    {spec}
                  </option>
                ))}
              </select>
            </div>
            <Button
              variant="outline"
              onClick={() => refetch()}
              disabled={isLoading}
              className="md:w-auto"
            >
              <RefreshCw
                className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
              />
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {doctors.length === 0 ? (
        <EmptyState
          title="No doctors found"
          description="Try adjusting your search criteria or filters."
        />
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {doctors.map((doctor: Doctor) => (
              <Card
                key={doctor.id}
                className="hover:shadow-lg transition-shadow"
              >
                <CardContent className="p-6">
                  <div className="flex flex-col items-center text-center space-y-4">
                    {doctor.photo_url ? (
                      <img
                        src={doctor.photo_url}
                        alt={doctor.name}
                        className="w-20 h-20 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center">
                        <User size={32} className="text-blue-600" />
                      </div>
                    )}

                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {doctor.name}
                      </h3>
                      <p className="text-blue-600 font-medium">
                        {doctor.specialization}
                      </p>
                      <p className="text-sm text-gray-500 mt-1">
                        {doctor.email}
                      </p>
                    </div>

                    <Button
                      onClick={() => handleBookAppointment(doctor)}
                      className="w-full"
                    >
                      <Calendar className="mr-2 h-4 w-4" />
                      Book Appointment
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex justify-center space-x-2">
              <Button
                variant="outline"
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              <span className="px-4 py-2 text-sm text-gray-700">
                Page {currentPage} of {pagination.totalPages}
              </span>
              <Button
                variant="outline"
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={currentPage === pagination.totalPages}
              >
                Next
              </Button>
            </div>
          )}
        </>
      )}

      {/* Book Appointment Modal */}
      {selectedDoctor && (
        <BookAppointmentModal
          open={showBookingModal}
          onClose={() => setShowBookingModal(false)}
          doctor={selectedDoctor}
        />
      )}
    </div>
  );
}
