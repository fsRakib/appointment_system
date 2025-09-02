import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import User from "@/lib/models/User";
import bcrypt from "bcryptjs";

export async function POST(req) {
  await dbConnect();
  const body = await req.json();
  const { name, email, password, role, specialization, photo_url } = body;

  if (!name || !email || !password || !role) {
    return NextResponse.json(
      { error: "Missing required fields" },
      { status: 400 }
    );
  }

  const existing = await User.findOne({ email });
  if (existing) {
    return NextResponse.json(
      { error: "Email already registered" },
      { status: 409 }
    );
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const user = new User({
    name,
    email,
    password: hashedPassword,
    role,
    specialization: role === "DOCTOR" ? specialization : undefined,
    photo_url,
  });
  await user.save();

  return NextResponse.json(
    {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      specialization: user.specialization,
      photo_url: user.photo_url,
    },
    { status: 201 }
  );
}
