"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth-provider";

interface AuthRedirectProps {
  children: React.ReactNode;
  redirectAuthenticatedUsers?: boolean;
}

/**
 * Component that redirects authenticated users away from auth pages
 * and prevents them from accessing login/register pages via browser navigation
 */
export function AuthRedirect({
  children,
  redirectAuthenticatedUsers = false,
}: AuthRedirectProps) {
  const { user, isAuthenticated, isInitialized } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isInitialized) {
      return; // Wait for auth to initialize
    }

    if (redirectAuthenticatedUsers && isAuthenticated && user) {
      const dashboardUrl =
        user.role === "DOCTOR" ? "/doctor/dashboard" : "/patient/dashboard";

      console.log(`🔄 Redirecting authenticated ${user.role} to dashboard`);

      // Use replace instead of push to prevent going back
      router.replace(dashboardUrl);
      return;
    }
  }, [
    isAuthenticated,
    isInitialized,
    user,
    router,
    redirectAuthenticatedUsers,
  ]);

  // Enhanced browser history protection
  useEffect(() => {
    if (!isInitialized || !redirectAuthenticatedUsers) {
      return;
    }

    if (isAuthenticated && user) {
      const dashboardUrl =
        user.role === "DOCTOR" ? "/doctor/dashboard" : "/patient/dashboard";

      // Replace current history entry to prevent back navigation
      if (typeof window !== "undefined") {
        window.history.replaceState(null, "", dashboardUrl);
      }

      const handlePopState = (event: PopStateEvent) => {
        // Prevent navigation back to auth pages
        console.log("🚫 Preventing navigation back to auth page");
        event.preventDefault();

        // Force navigation to dashboard
        router.replace(dashboardUrl);

        // Replace history state again
        window.history.replaceState(null, "", dashboardUrl);
      };

      const handleBeforeUnload = () => {
        // Clear auth-related pages from history when navigating away
        if (typeof window !== "undefined") {
          const currentPath = window.location.pathname;
          if (
            currentPath === "/login" ||
            currentPath === "/register" ||
            currentPath === "/"
          ) {
            window.history.replaceState(null, "", dashboardUrl);
          }
        }
      };

      // Listen for browser back/forward navigation
      window.addEventListener("popstate", handlePopState);
      window.addEventListener("beforeunload", handleBeforeUnload);

      // Cleanup listeners
      return () => {
        window.removeEventListener("popstate", handlePopState);
        window.removeEventListener("beforeunload", handleBeforeUnload);
      };
    }
  }, [
    isAuthenticated,
    isInitialized,
    user,
    router,
    redirectAuthenticatedUsers,
  ]);

  // Additional protection: prevent rendering auth pages for authenticated users
  useEffect(() => {
    if (
      redirectAuthenticatedUsers &&
      isInitialized &&
      isAuthenticated &&
      user
    ) {
      // Clear any auth-related pages from browser history
      if (typeof window !== "undefined") {
        const currentPath = window.location.pathname;
        if (
          currentPath === "/login" ||
          currentPath === "/register" ||
          currentPath === "/"
        ) {
          const dashboardUrl =
            user.role === "DOCTOR" ? "/doctor/dashboard" : "/patient/dashboard";

          // Push dashboard to history and then replace to clean the stack
          window.history.pushState(null, "", dashboardUrl);
          window.history.replaceState(null, "", dashboardUrl);
        }
      }
    }
  }, [isAuthenticated, isInitialized, user, redirectAuthenticatedUsers]);

  // Don't render children if we're redirecting
  if (redirectAuthenticatedUsers && isInitialized && isAuthenticated && user) {
    return null;
  }

  return <>{children}</>;
}
