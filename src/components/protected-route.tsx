"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth-provider";
import { LoadingSpinner } from "@/components/ui/loading";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: ("DOCTOR" | "PATIENT")[];
}

export function ProtectedRoute({
  children,
  allowedRoles,
}: ProtectedRouteProps) {
  const { user, isAuthenticated, isInitialized } = useAuth();
  const router = useRouter();

  useEffect(() => {
    console.log("🔒 ProtectedRoute - Auth state:", {
      isInitialized,
      isAuthenticated,
      user: user?.name || "none",
      allowedRoles,
    });

    // Don't redirect until auth is initialized
    if (!isInitialized) {
      console.log("⏳ Waiting for auth initialization...");
      return;
    }

    if (!isAuthenticated) {
      console.log("🚪 Redirecting to login - not authenticated");
      router.push("/login");
      return;
    }

    if (allowedRoles && user && !allowedRoles.includes(user.role)) {
      // Redirect to appropriate dashboard based on role
      const redirectPath =
        user.role === "DOCTOR" ? "/doctor/dashboard" : "/patient/dashboard";
      console.log("🔄 Redirecting to dashboard:", redirectPath);
      router.push(redirectPath);
      return;
    }

    console.log("✅ Access granted to protected route");
  }, [isAuthenticated, isInitialized, user, allowedRoles, router]);

  // Show loading while initializing
  if (!isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return <>{children}</>;
}
