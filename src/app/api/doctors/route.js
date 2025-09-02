import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import User from "@/lib/models/User";

export async function GET(req) {
  await dbConnect();

  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "10");
  const search = searchParams.get("search") || "";
  const specialization = searchParams.get("specialization") || "";

  try {
    // Build query
    const query = { role: "DOCTOR" };

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { specialization: { $regex: search, $options: "i" } },
      ];
    }

    if (specialization) {
      query.specialization = specialization;
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Get doctors and total count
    const [doctors, total] = await Promise.all([
      User.find(query)
        .select("-password") // Exclude password field
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 }),
      User.countDocuments(query),
    ]);

    // Format doctors with id field
    const formattedDoctors = doctors.map((doctor) => ({
      id: doctor._id.toString(),
      name: doctor.name,
      email: doctor.email,
      role: doctor.role,
      specialization: doctor.specialization,
      photo_url: doctor.photo_url,
      createdAt: doctor.createdAt,
    }));

    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      data: formattedDoctors,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    });
  } catch (error) {
    console.error("Error fetching doctors:", error);
    return NextResponse.json(
      { error: "Failed to fetch doctors" },
      { status: 500 }
    );
  }
}
