"use client";

import { useState } from "react";
import { Calendar, User, X, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loading, EmptyState } from "@/components/ui/loading";
import { Pagination } from "@/components/ui/pagination";
import { usePatientAppointments, useCancelAppointment } from "@/lib/queries";
import { formatDate, getStatusColor } from "@/lib/utils";
import { Modal } from "@/components/ui/modal";

export function AppointmentsList() {
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<any>(null);

  const { data: appointmentsData, isLoading } = usePatientAppointments({
    page: currentPage,
    limit: 10,
    status: statusFilter,
  });

  const cancelAppointmentMutation = useCancelAppointment();

  const statusOptions = [
    { value: "", label: "All Appointments" },
    { value: "PENDING", label: "Pending" },
    { value: "COMPLETED", label: "Completed" },
    { value: "CANCELLED", label: "Cancelled" },
  ];

  const handleCancelClick = (appointment: any) => {
    setSelectedAppointment(appointment);
    setShowCancelModal(true);
  };

  const handleCancelConfirm = async () => {
    if (selectedAppointment) {
      try {
        await cancelAppointmentMutation.mutateAsync(selectedAppointment.id);
        setShowCancelModal(false);
        setSelectedAppointment(null);
      } catch (error) {
        console.error("Failed to cancel appointment:", error);
      }
    }
  };

  if (isLoading) {
    return <Loading text="Loading appointments..." />;
  }

  const appointments = appointmentsData?.data || [];
  const pagination = appointmentsData?.pagination || { totalPages: 1 };

  return (
    <div className="space-y-6">
      {/* Filter */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center space-x-4">
            <Filter size={20} className="text-gray-400" />
            <div className="flex-1 max-w-xs">
              <Select
                options={statusOptions}
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                placeholder="Filter by status"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Appointments List */}
      {appointments.length === 0 ? (
        <EmptyState
          title="No appointments found"
          description="You haven't booked any appointments yet or no appointments match your filter."
        />
      ) : (
        <>
          <div className="space-y-4">
            {appointments.map((appointment: any) => (
              <Card key={appointment.id}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      {appointment.doctor?.photo_url ? (
                        <img
                          src={appointment.doctor.photo_url}
                          alt={appointment.doctor.name}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                          <User size={24} className="text-blue-600" />
                        </div>
                      )}

                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {appointment.doctor?.name}
                        </h3>
                        <p className="text-blue-600 text-sm">
                          {appointment.doctor?.specialization}
                        </p>
                        <div className="flex items-center space-x-4 mt-1">
                          <div className="flex items-center text-gray-600 text-sm">
                            <Calendar size={16} className="mr-1" />
                            {formatDate(appointment.date)}
                          </div>
                          <span
                            className={`px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(
                              appointment.status
                            )}`}
                          >
                            {appointment.status}
                          </span>
                        </div>
                      </div>
                    </div>

                    {appointment.status === "PENDING" && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleCancelClick(appointment)}
                        className="text-red-600 border-red-300 hover:bg-red-50"
                      >
                        <X size={16} className="mr-1" />
                        Cancel
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Pagination */}
          <Pagination
            currentPage={currentPage}
            totalPages={pagination.totalPages}
            onPageChange={setCurrentPage}
          />
        </>
      )}

      {/* Cancel Confirmation Modal */}
      <Modal
        open={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        title="Cancel Appointment"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            Are you sure you want to cancel your appointment with{" "}
            <strong>{selectedAppointment?.doctor?.name}</strong> on{" "}
            <strong>
              {selectedAppointment && formatDate(selectedAppointment.date)}
            </strong>
            ?
          </p>
          <p className="text-sm text-red-600">This action cannot be undone.</p>
          <div className="flex justify-end space-x-3">
            <Button variant="outline" onClick={() => setShowCancelModal(false)}>
              Keep Appointment
            </Button>
            <Button
              variant="danger"
              onClick={handleCancelConfirm}
              loading={cancelAppointmentMutation.isPending}
            >
              Cancel Appointment
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
