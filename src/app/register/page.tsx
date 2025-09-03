"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/components/auth-provider";
import { AuthRedirect } from "@/components/auth-redirect";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSpecializations } from "@/lib/queries";
import { useAuthStore } from "@/lib/store";
import {
  PatientRegistrationFormData,
  DoctorRegistrationFormData,
  patientRegistrationSchema,
  doctorRegistrationSchema,
} from "@/lib/schemas";
import { Stethoscope, User, UserCheck } from "lucide-react";

interface SuccessInfo {
  type: "patient" | "doctor";
  data: {
    name: string;
    email: string;
    role: string;
    specialization?: string;
  };
}

export default function RegisterPage() {
  const [activeTab, setActiveTab] = useState<"patient" | "doctor">("patient");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [successInfo, setSuccessInfo] = useState<SuccessInfo | null>(null);
  const { register: registerUser } = useAuth();
  const router = useRouter();
  const { data: specializations } = useSpecializations();

  console.log("🔍 Specializations data:", specializations);

  // Fallback specializations in case API fails
  const fallbackSpecializations = [
    "Cardiology",
    "Dermatology",
    "Emergency Medicine",
    "Family Medicine",
    "Gastroenterology",
    "Internal Medicine",
    "Neurology",
    "Pediatrics",
  ];

  const patientForm = useForm<PatientRegistrationFormData>({
    resolver: zodResolver(patientRegistrationSchema),
  });

  const doctorForm = useForm<DoctorRegistrationFormData>({
    resolver: zodResolver(doctorRegistrationSchema),
  });

  const onSubmitPatient = async (data: PatientRegistrationFormData) => {
    setIsLoading(true);
    setError("");
    setSuccessInfo(null);

    try {
      console.log("🔄 Submitting patient registration:", data);
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { confirmPassword, ...userData } = {
        ...data,
        role: "PATIENT" as const,
      };

      console.log("🔄 Calling registerUser with:", userData);
      await registerUser(userData);

      // Get the registered user from auth store
      const currentUser = useAuthStore.getState().user;

      if (!currentUser?.id) {
        throw new Error("User ID not found after registration");
      }

      setSuccessInfo({ type: "patient", data: userData });

      // Auto-redirect to patient dashboard with user ID
      setTimeout(() => {
        router.replace(`/patient/${currentUser.id}/dashboard`);
      }, 3000);
    } catch (err) {
      console.error("❌ Patient registration error:", err);
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmitDoctor = async (data: DoctorRegistrationFormData) => {
    setIsLoading(true);
    setError("");
    setSuccessInfo(null);

    try {
      console.log("🔄 Submitting doctor registration:", data);
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { confirmPassword, ...userData } = {
        ...data,
        role: "DOCTOR" as const,
      };

      console.log("🔄 Calling registerUser with:", userData);
      await registerUser(userData);

      // Get the registered user from auth store
      const currentUser = useAuthStore.getState().user;

      if (!currentUser?.id) {
        throw new Error("User ID not found after registration");
      }

      setSuccessInfo({ type: "doctor", data: userData });

      // Auto-redirect to doctor dashboard with user ID after showing success
      setTimeout(() => {
        router.replace(`/doctor/${currentUser.id}/dashboard`);
      }, 5000);
    } catch (err) {
      console.error("❌ Doctor registration error:", err);
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setIsLoading(false);
    }
  };

  const specializationOptions =
    specializations?.data?.map((spec: string) => ({
      value: spec,
      label: spec,
    })) ||
    fallbackSpecializations.map((spec: string) => ({
      value: spec,
      label: spec,
    }));

  console.log("🔍 Specialization options:", specializationOptions);

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
              Create account
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Join our platform to book appointments
            </p>
          </div>

          {/* Registration Form */}
          <div className="bg-white py-8 px-6 shadow-xl rounded-lg">
            {successInfo && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
                <div className="text-center space-y-4">
                  <div className="text-green-800">
                    <UserCheck className="mx-auto h-12 w-12 text-green-600 mb-2" />
                    <h3 className="text-lg font-semibold">
                      Registration Successful!
                    </h3>
                    <p className="text-sm mt-2">
                      Your {successInfo.type} account has been created
                      successfully.
                    </p>
                  </div>

                  {successInfo.type === "doctor" && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-left">
                      <h4 className="font-medium text-blue-800 mb-2">
                        🧪 Testing Information:
                      </h4>
                      <div className="text-sm text-blue-700 space-y-1">
                        <p>
                          <strong>Doctor Name:</strong> {successInfo.data.name}
                        </p>
                        <p>
                          <strong>Specialization:</strong>{" "}
                          {successInfo.data.specialization}
                        </p>
                        <p>
                          <strong>Email:</strong> {successInfo.data.email}
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="flex space-x-3">
                    <Button
                      onClick={() => router.push("/login")}
                      className="flex-1"
                    >
                      Go to Login
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setSuccessInfo(null);
                        setActiveTab("patient");
                        patientForm.reset();
                        doctorForm.reset();
                      }}
                      className="flex-1"
                    >
                      Register Another
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {!successInfo && (
              <div>
                {/* Error Display */}
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-6">
                    {error}
                  </div>
                )}
                {/* Tabs */}
                <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg mb-6">
                  <button
                    type="button"
                    onClick={() => setActiveTab("patient")}
                    className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-colors ${
                      activeTab === "patient"
                        ? "bg-white text-blue-600 shadow-sm"
                        : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    <User className="inline-block mr-2 h-4 w-4" />
                    Patient
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab("doctor")}
                    className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-colors ${
                      activeTab === "doctor"
                        ? "bg-white text-blue-600 shadow-sm"
                        : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    <UserCheck className="inline-block mr-2 h-4 w-4" />
                    Doctor
                  </button>
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-6">
                    {error}
                  </div>
                )}

                {/* Patient Registration */}
                {activeTab === "patient" && (
                  <form
                    onSubmit={patientForm.handleSubmit(onSubmitPatient)}
                    className="space-y-6"
                  >
                    <Input
                      placeholder="Enter your full name"
                      {...patientForm.register("name")}
                    />

                    <Input
                      type="email"
                      placeholder="Enter your email"
                      {...patientForm.register("email")}
                    />

                    <Input
                      type="password"
                      placeholder="Create a password"
                      {...patientForm.register("password")}
                    />

                    <Input
                      type="password"
                      placeholder="Confirm your password"
                      {...patientForm.register("confirmPassword")}
                    />

                    <Input
                      placeholder="Enter photo URL"
                      {...patientForm.register("photo_url")}
                    />

                    <Button
                      type="submit"
                      className="w-full"
                      disabled={isLoading}
                    >
                      <User className="mr-2 h-4 w-4" />
                      {isLoading
                        ? "Creating Account..."
                        : "Create Patient Account"}
                    </Button>
                  </form>
                )}

                {/* Doctor Registration */}
                {activeTab === "doctor" && (
                  <form
                    onSubmit={doctorForm.handleSubmit(onSubmitDoctor)}
                    className="space-y-6"
                  >
                    <Input
                      placeholder="Enter your full name"
                      {...doctorForm.register("name")}
                    />

                    <Input
                      type="email"
                      placeholder="Enter your email"
                      {...doctorForm.register("email")}
                    />

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Specialization
                      </label>
                      <select
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        {...doctorForm.register("specialization")}
                      >
                        <option value="">Select your specialization</option>
                        {specializationOptions.map(
                          (opt: { value: string; label: string }) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          )
                        )}
                      </select>
                    </div>
                    {doctorForm.formState.errors.specialization && (
                      <p className="text-red-500 text-sm mt-1">
                        {doctorForm.formState.errors.specialization.message}
                      </p>
                    )}

                    <Input
                      type="password"
                      placeholder="Create a password"
                      {...doctorForm.register("password")}
                    />

                    <Input
                      type="password"
                      placeholder="Confirm your password"
                      {...doctorForm.register("confirmPassword")}
                    />

                    <Input
                      placeholder="Enter photo URL"
                      {...doctorForm.register("photo_url")}
                    />

                    <Button
                      type="submit"
                      className="w-full"
                      disabled={isLoading}
                    >
                      <UserCheck className="mr-2 h-4 w-4" />
                      {isLoading
                        ? "Creating Account..."
                        : "Create Doctor Account"}
                    </Button>
                  </form>
                )}

                <div className="mt-6 text-center">
                  <p className="text-sm text-gray-600">
                    Already have an account?{" "}
                    <Link
                      href="/login"
                      className="font-medium text-blue-600 hover:text-blue-500"
                    >
                      Sign in here
                    </Link>
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </AuthRedirect>
  );
}
