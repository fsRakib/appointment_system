"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AuthRedirect } from "@/components/auth-redirect";
import {
  Stethoscope,
  Calendar,
  Users,
  Shield,
  Clock,
  CheckCircle,
} from "lucide-react";
import Link from "next/link";

export default function HomePage() {
  return (
    <AuthRedirect redirectAuthenticatedUsers={true}>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        {/* Header */}
        <header className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <div className="flex items-center space-x-2">
                <Stethoscope className="h-8 w-8 text-blue-600" />
                <h1 className="text-xl font-bold text-gray-900">
                  Doctor Appointment System
                </h1>
              </div>
              <div className="flex space-x-4">
                <Link href="/login">
                  <Button variant="outline">Sign In</Button>
                </Link>
                <Link href="/register">
                  <Button>Get Started</Button>
                </Link>
              </div>
            </div>
          </div>
        </header>

        {/* Hero Section */}
        <section className="py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-5xl font-bold text-gray-900 mb-6">
              Healthcare Made Simple
            </h2>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Connect with experienced doctors, book appointments seamlessly,
              and manage your healthcare journey all in one place.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/register">
                <Button size="lg" className="w-full sm:w-auto">
                  <Users className="mr-2 h-5 w-5" />
                  Book as Patient
                </Button>
              </Link>
              <Link href="/register">
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full sm:w-auto"
                >
                  <Stethoscope className="mr-2 h-5 w-5" />
                  Join as Doctor
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h3 className="text-3xl font-bold text-center text-gray-900 mb-12">
              Why Choose Our Platform?
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <Card>
                <CardContent className="p-6 text-center">
                  <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                    <Calendar className="h-8 w-8 text-blue-600" />
                  </div>
                  <h4 className="text-xl font-semibold text-gray-900 mb-2">
                    Easy Booking
                  </h4>
                  <p className="text-gray-600">
                    Book appointments with just a few clicks. Choose your
                    preferred doctor and time slot.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6 text-center">
                  <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                    <Users className="h-8 w-8 text-green-600" />
                  </div>
                  <h4 className="text-xl font-semibold text-gray-900 mb-2">
                    Expert Doctors
                  </h4>
                  <p className="text-gray-600">
                    Access to qualified healthcare professionals across multiple
                    specializations.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6 text-center">
                  <div className="mx-auto w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mb-4">
                    <Shield className="h-8 w-8 text-purple-600" />
                  </div>
                  <h4 className="text-xl font-semibold text-gray-900 mb-2">
                    Secure & Private
                  </h4>
                  <p className="text-gray-600">
                    Your health information is protected with industry-standard
                    security measures.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6 text-center">
                  <div className="mx-auto w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mb-4">
                    <Clock className="h-8 w-8 text-orange-600" />
                  </div>
                  <h4 className="text-xl font-semibold text-gray-900 mb-2">
                    24/7 Access
                  </h4>
                  <p className="text-gray-600">
                    Book and manage appointments anytime, anywhere. Healthcare
                    at your convenience.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6 text-center">
                  <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                    <CheckCircle className="h-8 w-8 text-red-600" />
                  </div>
                  <h4 className="text-xl font-semibold text-gray-900 mb-2">
                    Real-time Updates
                  </h4>
                  <p className="text-gray-600">
                    Get instant notifications about appointment confirmations
                    and updates.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6 text-center">
                  <div className="mx-auto w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mb-4">
                    <Stethoscope className="h-8 w-8 text-indigo-600" />
                  </div>
                  <h4 className="text-xl font-semibold text-gray-900 mb-2">
                    Multiple Specialties
                  </h4>
                  <p className="text-gray-600">
                    Find specialists in cardiology, neurology, dermatology, and
                    many more fields.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 bg-blue-600">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h3 className="text-3xl font-bold text-white mb-4">
              Ready to Get Started?
            </h3>
            <p className="text-xl text-blue-100 mb-8">
              Join thousands of patients and doctors who trust our platform for
              their healthcare needs.
            </p>
            <Link href="/register">
              <Button size="lg" variant="secondary">
                Create Your Account
              </Button>
            </Link>
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-gray-900 text-white py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="flex items-center justify-center space-x-2 mb-4">
              <Stethoscope className="h-6 w-6" />
              <span className="text-lg font-semibold">
                Doctor Appointment System
              </span>
            </div>
            <p className="text-gray-400">
              © 2025 Doctor Appointment System. All rights reserved.
            </p>
          </div>
        </footer>
      </div>
    </AuthRedirect>
  );
}
