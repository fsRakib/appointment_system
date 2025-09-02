"use client";

import { useState } from "react";
import { Calendar, User, Filter, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Loading, EmptyState } from "@/components/ui/loading";
import { Pagination } from "@/components/ui/pagination";
import { Modal } from "@/components/ui/modal";
import {
  useDoctorAppointments,
  useUpdateAppointmentStatus,
} from "@/lib/queries";
import { formatDate, getStatusColor } from "@/lib/utils";

export function DoctorAppointmentsList() {
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<any>(null);
  const [newStatus, setNewStatus] = useState("");

  const { data: appointmentsData, isLoading } = useDoctorAppointments({
    page: currentPage,
    limit: 10,
    status: statusFilter,
    date: dateFilter,
  });

  const updateStatusMutation = useUpdateAppointmentStatus();

  const statusOptions = [
    { value: "", label: "All Appointments" },
    { value: "PENDING", label: "Pending" },
    { value: "COMPLETED", label: "Completed" },
    { value: "CANCELLED", label: "Cancelled" },
  ];

  const handleStatusChange = (appointment: any, status: string) => {
    setSelectedAppointment(appointment);
    setNewStatus(status);
    setShowStatusModal(true);
  };

  const handleStatusConfirm = async () => {
    if (selectedAppointment && newStatus) {
      try {
        await updateStatusMutation.mutateAsync({
          appointmentId: selectedAppointment.id,
          status: newStatus,
        });
        setShowStatusModal(false);
        setSelectedAppointment(null);
        setNewStatus("");
      } catch (error) {
        console.error("Failed to update appointment status:", error);
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
      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Input
                type="date"
                placeholder="Filter by date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
              />
            </div>
            <div className="md:w-64">
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
          description="No appointments match your current filters or you don't have any appointments yet."
        />
      ) : (
        <>
          <div className="space-y-4">
            {appointments.map((appointment: any) => (
              <Card key={appointment.id}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      {appointment.patient?.photo_url ? (
                        <img
                          src={appointment.patient.photo_url}
                          alt={appointment.patient.name}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
                          <User size={24} className="text-gray-600" />
                        </div>
                      )}

                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {appointment.patient?.name}
                        </h3>
                        <p className="text-gray-600 text-sm">
                          {appointment.patient?.email}
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
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          onClick={() =>
                            handleStatusChange(appointment, "COMPLETED")
                          }
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <Check size={16} className="mr-1" />
                          Complete
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            handleStatusChange(appointment, "CANCELLED")
                          }
                          className="text-red-600 border-red-300 hover:bg-red-50"
                        >
                          <X size={16} className="mr-1" />
                          Cancel
                        </Button>
                      </div>
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

      {/* Status Update Confirmation Modal */}
      <Modal
        open={showStatusModal}
        onClose={() => setShowStatusModal(false)}
        title={`${
          newStatus === "COMPLETED" ? "Complete" : "Cancel"
        } Appointment`}
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            Are you sure you want to mark the appointment with{" "}
            <strong>{selectedAppointment?.patient?.name}</strong> on{" "}
            <strong>
              {selectedAppointment && formatDate(selectedAppointment.date)}
            </strong>{" "}
            as <strong>{newStatus.toLowerCase()}</strong>?
          </p>
          <div className="flex justify-end space-x-3">
            <Button variant="outline" onClick={() => setShowStatusModal(false)}>
              Cancel
            </Button>
            <Button
              variant={newStatus === "COMPLETED" ? "primary" : "danger"}
              onClick={handleStatusConfirm}
              loading={updateStatusMutation.isPending}
            >
              {newStatus === "COMPLETED"
                ? "Mark as Completed"
                : "Cancel Appointment"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
