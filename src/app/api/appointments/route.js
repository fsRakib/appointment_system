import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Appointment from "@/lib/models/Appointment";
import User from "@/lib/models/User";

// GET /api/appointments - Get all appointments (for admin or with filters)
export async function GET(request) {
  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page")) || 1;
    const limit = parseInt(searchParams.get("limit")) || 10;
    const status = searchParams.get("status");
    const doctorId = searchParams.get("doctorId");
    const patientId = searchParams.get("patientId");

    // Build query
    const query = {};
    if (status) query.status = status;
    if (doctorId) query.doctorId = doctorId;
    if (patientId) query.patientId = patientId;

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Get appointments with populated doctor and patient data
    const appointments = await Appointment.find(query)
      .populate("doctorId", "name email specialization photo_url")
      .populate("patientId", "name email photo_url")
      .populate("createdBy", "name email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // Get total count for pagination
    const total = await Appointment.countDocuments(query);

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
    console.error("Error fetching appointments:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch appointments" },
      { status: 500 }
    );
  }
}

// POST /api/appointments - Create new appointment
export async function POST(request) {
  try {
    await dbConnect();

    const body = await request.json();
    const { doctorId, date, notes, patientId } = body;

    console.log("=== APPOINTMENT CREATION (NO AUTH) ===");
    console.log("Request body:", body);

    // Validate required fields
    if (!doctorId || !date) {
      return NextResponse.json(
        { success: false, error: "Doctor ID and date are required" },
        { status: 400 }
      );
    }

    // If no patientId provided, we'll need to get it from the request body or use a default
    let currentPatientId = patientId;
    if (!currentPatientId) {
      // For now, use a hardcoded patient ID or extract from request
      // In a real app, you'd get this from the authenticated user
      console.log("No patientId provided in request");
      return NextResponse.json(
        { success: false, error: "Patient ID is required" },
        { status: 400 }
      );
    }

    console.log("Creating appointment for patient:", currentPatientId);
    console.log("With doctor:", doctorId);
    console.log("On date:", date);

    // Validate date is in the future
    const appointmentDate = new Date(date);
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    if (appointmentDate < tomorrow) {
      return NextResponse.json(
        { success: false, error: "Appointment date must be tomorrow or later" },
        { status: 400 }
      );
    }

    // Verify doctor exists
    const doctor = await User.findById(doctorId);
    if (!doctor || doctor.role !== "DOCTOR") {
      return NextResponse.json(
        { success: false, error: "Invalid doctor" },
        { status: 400 }
      );
    }

    // Check for existing appointment at the same time
    const existingAppointment = await Appointment.findOne({
      doctorId,
      date: appointmentDate,
      status: { $in: ["PENDING", "CONFIRMED"] },
    });

    if (existingAppointment) {
      return NextResponse.json(
        { success: false, error: "This time slot is already booked" },
        { status: 409 }
      );
    }

    // Create appointment
    const appointment = new Appointment({
      patientId: currentPatientId,
      doctorId,
      date: appointmentDate,
      notes: notes || "",
      createdBy: currentPatientId,
    });

    await appointment.save();

    // Populate the appointment data for response
    await appointment.populate(
      "doctorId",
      "name email specialization photo_url"
    );
    await appointment.populate("patientId", "name email photo_url");

    return NextResponse.json(
      {
        success: true,
        data: appointment,
        message: "Appointment booked successfully",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating appointment:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create appointment" },
      { status: 500 }
    );
  }
}
