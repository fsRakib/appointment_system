import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import User from "@/lib/models/User";
import bcrypt from "bcryptjs";

export async function POST(req) {
  let body;

  try {
    console.log("🔄 Register API called");
    console.log("Environment:", process.env.NODE_ENV);
    console.log("MongoDB URI exists:", !!process.env.MONGODB_URI);

    // Parse request body first
    try {
      body = await req.json();
      console.log("📦 Request body parsed:", { ...body, password: "***" });
    } catch (parseError) {
      console.error("❌ Failed to parse request body:", parseError);
      return NextResponse.json(
        { error: "Invalid request body", details: parseError.message },
        { status: 400 }
      );
    }

    // Try database connection
    try {
      await dbConnect();
      console.log("✅ Database connected");
    } catch (dbError) {
      console.error("❌ Database connection failed:", dbError);
      return NextResponse.json(
        { error: "Database connection failed", details: dbError.message },
        { status: 500 }
      );
    }

    const { name, email, password, role, specialization, photo_url } = body;

    if (!name || !email || !password || !role) {
      console.log("❌ Missing required fields");
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    console.log("🔍 Checking for existing user with email:", email);
    let existing;
    try {
      existing = await User.findOne({ email });
    } catch (findError) {
      console.error("❌ Error checking existing user:", findError);
      return NextResponse.json(
        { error: "Database query failed", details: findError.message },
        { status: 500 }
      );
    }

    if (existing) {
      console.log("❌ Email already exists");
      return NextResponse.json(
        { error: "Email already registered" },
        { status: 409 }
      );
    }

    console.log("🔐 Hashing password");
    let hashedPassword;
    try {
      hashedPassword = await bcrypt.hash(password, 10);
    } catch (hashError) {
      console.error("❌ Password hashing failed:", hashError);
      return NextResponse.json(
        { error: "Password processing failed", details: hashError.message },
        { status: 500 }
      );
    }

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
    let savedUser;
    try {
      savedUser = await user.save();
      console.log("✅ User saved successfully with ID:", savedUser._id);
    } catch (saveError) {
      console.error("❌ User save failed:", saveError);

      // Handle specific MongoDB errors
      if (saveError.code === 11000) {
        return NextResponse.json(
          { error: "Email already registered" },
          { status: 409 }
        );
      }

      // Handle validation errors
      if (saveError.name === "ValidationError") {
        return NextResponse.json(
          { error: `Validation error: ${saveError.message}` },
          { status: 400 }
        );
      }

      return NextResponse.json(
        { error: "Failed to save user", details: saveError.message },
        { status: 500 }
      );
    }

    const responseData = {
      id: savedUser._id.toString(),
      name: savedUser.name,
      email: savedUser.email,
      role: savedUser.role,
      specialization: savedUser.specialization,
      photo_url: savedUser.photo_url,
    };

    console.log("📤 Sending response:", responseData);
    return NextResponse.json(responseData, { status: 201 });
  } catch (error) {
    console.error("❌ Unexpected registration error:", error);
    console.error("Error stack:", error.stack);

    // Always return a valid JSON response
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error.message,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
