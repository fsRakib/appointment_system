import { NextResponse } from "next/server";

export async function GET(request) {
  const allCookies = request.cookies.getAll();
  const authCookie = request.cookies.get("auth-state");

  console.log("Debug - All cookies:", allCookies);
  console.log("Debug - Auth cookie:", authCookie);

  let parsedAuth = null;
  if (authCookie) {
    try {
      parsedAuth = JSON.parse(authCookie.value);
    } catch (error) {
      console.log("Debug - Error parsing auth cookie:", error);
    }
  }

  return NextResponse.json({
    success: true,
    cookies: allCookies,
    authCookie: authCookie,
    parsedAuth: parsedAuth,
    message: "Debug cookie information",
  });
}
