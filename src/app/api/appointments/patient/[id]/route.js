import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Appointment from "@/lib/models/Appointment";
import User from "@/lib/models/User";

// GET /api/appointments/patient/[id] - Get patient's appointments
export async function GET(request, { params }) {
  try {
    await dbConnect();

    const { id: patientId } = params;
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page")) || 1;
    const limit = parseInt(searchParams.get("limit")) || 10;
    const status = searchParams.get("status");

    console.log("=== PATIENT APPOINTMENTS (NO AUTH) ===");
    console.log("Fetching appointments for patient ID:", patientId);
    console.log("Page:", page, "Limit:", limit, "Status:", status);

    // Verify patient exists
    const patient = await User.findById(patientId);
    if (!patient || patient.role !== "PATIENT") {
      return NextResponse.json(
        { success: false, error: "Patient not found" },
        { status: 404 }
      );
    }

    // Build query
    const query = { patientId };
    if (status) query.status = status;

    console.log("Query for appointments:", query);

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Get appointments with populated doctor data
    const appointments = await Appointment.find(query)
      .populate("doctorId", "name email specialization photo_url")
      .sort({ date: -1 })
      .skip(skip)
      .limit(limit);

    // Get total count for pagination
    const total = await Appointment.countDocuments(query);

    console.log("Found appointments count:", appointments.length);
    console.log("Total appointments for patient:", total);
    console.log("Appointments data:", JSON.stringify(appointments, null, 2));

    return NextResponse.json({
      success: true,
      data: appointments,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching patient appointments:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch patient appointments" },
      { status: 500 }
    );
  }
}
