import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import User from "@/lib/models/User";
import bcrypt from "bcryptjs";

export async function POST(req) {
  try {
    console.log("🔄 Register API called");

    await dbConnect();
    console.log("✅ Database connected");

    const body = await req.json();
    console.log("📦 Request body:", { ...body, password: "***" });

    const { name, email, password, role, specialization, photo_url } = body;

    if (!name || !email || !password || !role) {
      console.log("❌ Missing required fields");
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    console.log("🔍 Checking for existing user with email:", email);
    const existing = await User.findOne({ email });
    if (existing) {
      console.log("❌ Email already exists");
      return NextResponse.json(
        { error: "Email already registered" },
        { status: 409 }
      );
    }

    console.log("🔐 Hashing password");
    const hashedPassword = await bcrypt.hash(password, 10);

    console.log("👤 Creating new user");
    const user = new User({
      name,
      email,
      password: hashedPassword,
      role,
      specialization: role === "DOCTOR" ? specialization : undefined,
      photo_url,
    });

    console.log("💾 Saving user to database");
    await user.save();
    console.log("✅ User saved successfully with ID:", user._id);

    const responseData = {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      specialization: user.specialization,
      photo_url: user.photo_url,
    };

    console.log("📤 Sending response:", responseData);
    return NextResponse.json(responseData, { status: 201 });
  } catch (error) {
    console.error("❌ Registration error:", error);

    // Handle specific MongoDB errors
    if (error.code === 11000) {
      console.log("❌ Duplicate key error");
      return NextResponse.json(
        { error: "Email already registered" },
        { status: 409 }
      );
    }

    // Handle validation errors
    if (error.name === "ValidationError") {
      console.log("❌ Validation error:", error.message);
      return NextResponse.json(
        { error: `Validation error: ${error.message}` },
        { status: 400 }
      );
    }

    // Generic error response
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
