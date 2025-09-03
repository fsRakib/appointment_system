"use client";

import { useState } from "react";
import { Calendar, User, Check, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Loading, EmptyState } from "@/components/ui/loading";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Modal } from "@/components/ui/modal";
import {
  useDoctorAppointments,
  useUpdateAppointmentStatus,
} from "@/lib/queries";
import { formatDate, getStatusColor } from "@/lib/utils";
import { Appointment } from "@/types";

interface DoctorAppointmentsListProps {
  doctorId?: string;
}

export function DoctorAppointmentsList({
  doctorId,
}: DoctorAppointmentsListProps = {}) {
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [dateFilter, setDateFilter] = useState("");
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedAppointment, setSelectedAppointment] =
    useState<Appointment | null>(null);
  const [newStatus, setNewStatus] = useState("");

  const { data: appointmentsData, isLoading } = useDoctorAppointments({
    page: currentPage,
    limit: 10,
    status: statusFilter === "ALL" ? undefined : statusFilter,
    date: dateFilter,
    doctorId,
  });

  const updateStatusMutation = useUpdateAppointmentStatus();

  const statusOptions = [
    { value: "ALL", label: "All Appointments" },
    { value: "PENDING", label: "Pending" },
    { value: "COMPLETED", label: "Completed" },
    { value: "CANCELLED", label: "Cancelled" },
  ];

  const handleStatusChange = (appointment: Appointment, status: string) => {
    setSelectedAppointment(appointment);
    setNewStatus(status);
    setShowStatusModal(true);
  };

  const handleStatusConfirm = async () => {
    if (selectedAppointment && newStatus) {
      try {
        await updateStatusMutation.mutateAsync({
          appointmentId:
            selectedAppointment.id ||
            (selectedAppointment as unknown as { _id: string })._id,
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
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
            {appointments.map((appointment: Appointment) => (
              <Card
                key={
                  appointment.id ||
                  (appointment as unknown as { _id: string })._id
                }
              >
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
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    if (currentPage > 1) setCurrentPage(currentPage - 1);
                  }}
                  className={
                    currentPage <= 1 ? "pointer-events-none opacity-50" : ""
                  }
                />
              </PaginationItem>

              {Array.from(
                { length: pagination.totalPages },
                (_, i) => i + 1
              ).map((page) => (
                <PaginationItem key={page}>
                  <PaginationLink
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      setCurrentPage(page);
                    }}
                    isActive={currentPage === page}
                  >
                    {page}
                  </PaginationLink>
                </PaginationItem>
              ))}

              <PaginationItem>
                <PaginationNext
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    if (currentPage < pagination.totalPages)
                      setCurrentPage(currentPage + 1);
                  }}
                  className={
                    currentPage >= pagination.totalPages
                      ? "pointer-events-none opacity-50"
                      : ""
                  }
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
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
              variant={newStatus === "COMPLETED" ? "default" : "destructive"}
              onClick={handleStatusConfirm}
              disabled={updateStatusMutation.isPending}
            >
              {updateStatusMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
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
