import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    status: "API is working",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    hasMongoUri: !!process.env.MONGODB_URI,
  });
}

export async function POST(req) {
  try {
    console.log("🔍 Debug register endpoint called");

    const body = await req.json();
    console.log("📦 Request body received:", body);

    return NextResponse.json({
      status: "Request received successfully",
      bodyReceived: body,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("❌ Debug endpoint error:", error);
    return NextResponse.json(
      { error: "Debug endpoint error", details: error.message },
      { status: 500 }
    );
  }
}
