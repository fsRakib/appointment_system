import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Get auth state from cookies
  const authStateCookie = request.cookies.get("auth-state");

  let isAuthenticated = false;
  let userRole: "DOCTOR" | "PATIENT" | null = null;

  if (authStateCookie) {
    try {
      const authData = JSON.parse(authStateCookie.value);
      isAuthenticated = authData.state?.isAuthenticated || false;
      userRole = authData.state?.user?.role || null;
    } catch (error) {
      console.error("[MIDDLEWARE] Error parsing auth cookie:", error);
      // Invalid cookie, treat as not authenticated
      isAuthenticated = false;
      userRole = null;
    }
  }

  // Debug logging in development
  if (process.env.NODE_ENV === "development") {
    console.log(
      `[MIDDLEWARE] ${pathname} | Auth: ${isAuthenticated} | Role: ${userRole}`
    );
  }

  // Define protected routes
  const protectedPatientRoutes = ["/patient"];
  const protectedDoctorRoutes = ["/doctor"];
  const authRoutes = ["/login", "/register"];
  const publicRoutes = ["/"];

  // Check if the current path matches any protected routes
  const isPatientRoute = protectedPatientRoutes.some((route) =>
    pathname.startsWith(route)
  );
  const isDoctorRoute = protectedDoctorRoutes.some((route) =>
    pathname.startsWith(route)
  );
  const isAuthRoute = authRoutes.includes(pathname);
  const isRootRoute = pathname === "/";

  // If user is authenticated
  if (isAuthenticated && userRole) {
    // Get user ID from auth data
    let userId = null;
    if (authStateCookie) {
      try {
        const authData = JSON.parse(authStateCookie.value);
        userId = authData.state?.user?.id;
      } catch (error) {
        console.error("[MIDDLEWARE] Error getting user ID:", error);
      }
    }

    // Redirect authenticated users away from auth pages and root
    if (isAuthRoute || isRootRoute) {
      const dashboardUrl = userId
        ? userRole === "DOCTOR"
          ? `/doctor/${userId}/dashboard`
          : `/patient/${userId}/dashboard`
        : userRole === "DOCTOR"
        ? "/doctor/dashboard"
        : "/patient/dashboard"; // fallback

      if (process.env.NODE_ENV === "development") {
        console.log(
          `[MIDDLEWARE] Redirecting authenticated ${userRole} from ${pathname} to ${dashboardUrl}`
        );
      }

      // Create redirect response with additional headers to prevent caching
      const response = NextResponse.redirect(
        new URL(dashboardUrl, request.url)
      );
      response.headers.set(
        "Cache-Control",
        "no-store, no-cache, must-revalidate"
      );
      response.headers.set("Pragma", "no-cache");
      response.headers.set("Expires", "0");
      return response;
    }

    // Check role-based access for protected routes
    if (isPatientRoute && userRole !== "PATIENT") {
      // Doctor trying to access patient routes
      if (process.env.NODE_ENV === "development") {
        console.log(
          `[MIDDLEWARE] Redirecting doctor from patient route ${pathname} to doctor dashboard`
        );
      }
      const redirectUrl = userId
        ? `/doctor/${userId}/dashboard`
        : "/doctor/dashboard";
      return NextResponse.redirect(new URL(redirectUrl, request.url));
    }

    if (isDoctorRoute && userRole !== "DOCTOR") {
      // Patient trying to access doctor routes
      if (process.env.NODE_ENV === "development") {
        console.log(
          `[MIDDLEWARE] Redirecting patient from doctor route ${pathname} to patient dashboard`
        );
      }
      const redirectUrl = userId
        ? `/patient/${userId}/dashboard`
        : "/patient/dashboard";
      return NextResponse.redirect(new URL(redirectUrl, request.url));
    }
  } else {
    // User is not authenticated
    // Redirect to login if trying to access protected routes
    if (isPatientRoute || isDoctorRoute) {
      if (process.env.NODE_ENV === "development") {
        console.log(
          `[MIDDLEWARE] Redirecting unauthenticated user from ${pathname} to login`
        );
      }
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  // Allow the request to continue
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     */
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.svg$|.*\\.png$|.*\\.jpg$|.*\\.jpeg$|.*\\.gif$|.*\\.ico$).*)",
  ],
};
