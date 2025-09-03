import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Appointment from "@/lib/models/Appointment";
import User from "@/lib/models/User";

// GET /api/appointments/[id] - Get specific appointment
export async function GET(request, { params }) {
  try {
    await dbConnect();

    const { id } = await params;

    const appointment = await Appointment.findById(id)
      .populate("doctorId", "name email specialization photo_url")
      .populate("patientId", "name email photo_url")
      .populate("createdBy", "name email");

    if (!appointment) {
      return NextResponse.json(
        { success: false, error: "Appointment not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: appointment,
    });
  } catch (error) {
    console.error("Error fetching appointment:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch appointment" },
      { status: 500 }
    );
  }
}

// PUT /api/appointments/[id] - Update appointment status
export async function PUT(request, { params }) {
  try {
    await dbConnect();

    const { id } = await params;
    const body = await request.json();
    const { status, notes } = body;

    console.log("=== APPOINTMENT UPDATE (NO AUTH) ===");
    console.log("Updating appointment ID:", id);
    console.log("New status:", status);
    console.log("New notes:", notes);

    // Find the appointment
    const appointment = await Appointment.findById(id);
    if (!appointment) {
      return NextResponse.json(
        { success: false, error: "Appointment not found" },
        { status: 404 }
      );
    }

    console.log("Found appointment:", appointment._id);

    // Validate status
    const validStatuses = ["PENDING", "CONFIRMED", "CANCELLED", "COMPLETED"];
    if (status && !validStatuses.includes(status)) {
      return NextResponse.json(
        { success: false, error: "Invalid status" },
        { status: 400 }
      );
    }

    // Update appointment
    const updateData = {};
    if (status) updateData.status = status;
    if (notes !== undefined) updateData.notes = notes;

    console.log("Update data:", updateData);

    const updatedAppointment = await Appointment.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    )
      .populate("doctorId", "name email specialization photo_url")
      .populate("patientId", "name email photo_url");

    console.log("✅ Appointment updated successfully");

    return NextResponse.json({
      success: true,
      data: updatedAppointment,
      message: "Appointment updated successfully",
    });
  } catch (error) {
    console.error("Error updating appointment:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update appointment" },
      { status: 500 }
    );
  }
}

// DELETE /api/appointments/[id] - Cancel/Delete appointment
export async function DELETE(request, { params }) {
  try {
    await dbConnect();

    const { id } = await params;

    console.log("=== APPOINTMENT CANCELLATION (NO AUTH) ===");
    console.log("Cancelling appointment ID:", id);

    // Find the appointment
    const appointment = await Appointment.findById(id);
    if (!appointment) {
      return NextResponse.json(
        { success: false, error: "Appointment not found" },
        { status: 404 }
      );
    }

    console.log("Found appointment to cancel:", appointment._id);

    // Update status to cancelled instead of deleting
    const cancelledAppointment = await Appointment.findByIdAndUpdate(
      id,
      { status: "CANCELLED" },
      { new: true }
    )
      .populate("doctorId", "name email specialization photo_url")
      .populate("patientId", "name email photo_url");

    console.log("✅ Appointment cancelled successfully");

    return NextResponse.json({
      success: true,
      data: cancelledAppointment,
      message: "Appointment cancelled successfully",
    });
  } catch (error) {
    console.error("Error cancelling appointment:", error);
    return NextResponse.json(
      { success: false, error: "Failed to cancel appointment" },
      { status: 500 }
    );
  }
}
