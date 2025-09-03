"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/components/auth-provider";
import { AuthRedirect } from "@/components/auth-redirect";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LoginFormData, loginSchema } from "@/lib/schemas";
import { useAuthStore } from "@/lib/store";
import { Stethoscope, User, UserCheck } from "lucide-react";

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const { login } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get("redirect");

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      role: "PATIENT",
    },
  });

  const selectedRole = watch("role");

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    setError("");

    try {
      console.log("🔄 Attempting login with:", {
        email: data.email,
        role: data.role,
      });

      await login(data.email, data.password, data.role);

      // Get the updated user from auth store after login
      const currentUser = useAuthStore.getState().user;

      if (!currentUser?.id) {
        throw new Error("User ID not found after login");
      }

      // Use redirect URL if available, otherwise use default dashboard with user ID
      const redirectPath =
        redirectUrl ||
        (data.role === "DOCTOR"
          ? `/doctor/${currentUser.id}/dashboard`
          : `/patient/${currentUser.id}/dashboard`);

      console.log("✅ Login successful, redirecting to:", redirectPath);

      // Use router.replace to prevent going back to login page
      router.replace(redirectPath);
    } catch (err) {
      console.error("❌ Login error:", err);
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setIsLoading(false);
    }
  };

  const roleOptions = [
    { value: "PATIENT", label: "Patient" },
    { value: "DOCTOR", label: "Doctor" },
  ];

  return (
    <AuthRedirect redirectAuthenticatedUsers={true}>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full space-y-8">
          {/* Header */}
          <div className="text-center">
            <div className="mx-auto h-12 w-12 bg-blue-600 rounded-full flex items-center justify-center">
              <Stethoscope className="h-6 w-6 text-white" />
            </div>
            <h2 className="mt-6 text-3xl font-bold text-gray-900">
              Welcome back
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Sign in to your account to continue
            </p>
          </div>

          {/* Login Form */}
          <div className="bg-white py-8 px-6 shadow-xl rounded-lg">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Login as
                </label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  {...register("role")}
                >
                  <option value="PATIENT">Patient</option>
                  <option value="DOCTOR">Doctor</option>
                </select>
              </div>

              <Input
                type="email"
                placeholder="Enter your email"
                {...register("email")}
              />

              <Input
                type="password"
                placeholder="Enter your password"
                {...register("password")}
              />

              <Button type="submit" className="w-full" disabled={isLoading}>
                {selectedRole === "DOCTOR" ? (
                  <>
                    <UserCheck className="mr-2 h-4 w-4" />
                    {isLoading ? "Signing in..." : "Sign in as Doctor"}
                  </>
                ) : (
                  <>
                    <User className="mr-2 h-4 w-4" />
                    {isLoading ? "Signing in..." : "Sign in as Patient"}
                  </>
                )}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Don&apos;t have an account?{" "}
                <Link
                  href="/register"
                  className="font-medium text-blue-600 hover:text-blue-500"
                >
                  Create one here
                </Link>
              </p>
            </div>

            {/* Demo Credentials */}
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <h4 className="text-sm font-medium text-gray-900 mb-2">
                Demo Credentials:
              </h4>
              <div className="text-xs text-gray-600 space-y-1">
                <p>
                  <strong>Doctor:</strong> sarah.johnson@hospital.com /
                  password123
                </p>
                <p>
                  <strong>Patient:</strong> Create a new account or use any
                  existing patient email
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AuthRedirect>
  );
}
