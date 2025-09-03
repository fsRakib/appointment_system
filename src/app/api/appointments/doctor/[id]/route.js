import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Appointment from "@/lib/models/Appointment";
import User from "@/lib/models/User";
import mongoose from "mongoose";

// GET /api/appointments/doctor/[id] - Get doctor's appointments
export async function GET(request, { params }) {
  try {
    await dbConnect();

    const { id: doctorId } = await params;
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page")) || 1;
    const limit = parseInt(searchParams.get("limit")) || 10;
    const status = searchParams.get("status");

    console.log("=== DOCTOR APPOINTMENTS (NO AUTH) ===");
    console.log("Fetching appointments for doctor ID:", doctorId);
    console.log("Page:", page, "Limit:", limit, "Status:", status);

    // Verify doctor exists
    const doctor = await User.findById(doctorId);
    if (!doctor || doctor.role !== "DOCTOR") {
      return NextResponse.json(
        { success: false, error: "Doctor not found" },
        { status: 404 }
      );
    }

    // Build query
    const query = { doctorId: new mongoose.Types.ObjectId(doctorId) };
    if (status) query.status = status;

    console.log("Query for appointments:", query);
    console.log(
      "Doctor ID as ObjectId:",
      new mongoose.Types.ObjectId(doctorId)
    );
    console.log("Searching in collection...");

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Get appointments with populated patient data
    console.log(
      "About to run Appointment.find with query:",
      JSON.stringify(query)
    );
    const appointments = await Appointment.find(query)
      .populate("patientId", "name email photo_url")
      .sort({ date: -1 })
      .skip(skip)
      .limit(limit);

    console.log("Query executed successfully");
    console.log("Raw appointments result:", appointments);

    // Transform appointments to include patient data in expected format
    const transformedAppointments = appointments.map((appointment) => ({
      _id: appointment._id,
      doctorId: appointment.doctorId,
      patientId: appointment.patientId?._id,
      patient: appointment.patientId, // Map patientId populated data to patient field
      date: appointment.date,
      status: appointment.status,
      notes: appointment.notes,
      createdBy: appointment.createdBy,
      createdAt: appointment.createdAt,
      updatedAt: appointment.updatedAt,
    }));

    // Get total count for pagination
    const total = await Appointment.countDocuments(query);

    console.log("Found appointments count:", appointments.length);
    console.log("Total appointments for doctor:", total);

    // Log each transformed appointment for debugging
    transformedAppointments.forEach((apt, index) => {
      console.log(`Transformed Appointment ${index + 1}:`, {
        id: apt._id,
        doctorId: apt.doctorId,
        patient: apt.patient,
        date: apt.date,
        status: apt.status,
      });
    });

    console.log("About to return response...");

    return NextResponse.json({
      success: true,
      data: transformedAppointments,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching doctor appointments:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch doctor appointments" },
      { status: 500 }
    );
  }
}
