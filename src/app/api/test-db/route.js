import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import User from "@/lib/models/User";

export async function GET() {
  try {
    console.log("🔍 Testing database connection...");

    // Test basic connection
    await dbConnect();
    console.log("✅ Database connected");

    // Test a simple query
    const userCount = await User.countDocuments();
    console.log("✅ User count query successful:", userCount);

    return NextResponse.json({
      status: "connected",
      userCount: userCount,
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      mongoUri: !!process.env.MONGODB_URI,
    });
  } catch (error) {
    console.error("❌ Database test failed:", error);
    return NextResponse.json(
      {
        status: "error",
        error: error.message,
        timestamp: new Date().toISOString(),
        mongoUri: !!process.env.MONGODB_URI,
      },
      { status: 500 }
    );
  }
}
