"use client";

import { createContext, useContext, useEffect, ReactNode } from "react";
import { useAuthStore } from "@/lib/store";
import { User } from "@/types";

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isInitialized: boolean;
  login: (
    email: string,
    password: string,
    role: "DOCTOR" | "PATIENT"
  ) => Promise<void>;
  register: (userData: Partial<User>) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const {
    user,
    isAuthenticated,
    isInitialized,
    login,
    register,
    logout,
    initializeAuth,
  } = useAuthStore();

  useEffect(() => {
    // Initialize auth on mount
    const initAuth = async () => {
      try {
        console.log("🔄 Starting auth initialization...");
        await initializeAuth();
        console.log(
          "✅ Auth initialized - user:",
          user,
          "authenticated:",
          isAuthenticated,
          "initialized:",
          isInitialized
        );
      } catch (error) {
        console.error("❌ Failed to initialize auth:", error);
      }
    };

    initAuth();
  }, [initializeAuth, isAuthenticated, isInitialized, user]);

  useEffect(() => {
    console.log(
      "Auth state changed - user:",
      user,
      "authenticated:",
      isAuthenticated
    );

    // Sync with localStorage when auth state changes
    if (user && isAuthenticated) {
      const currentUser = JSON.stringify(user);
      const storedUser = localStorage.getItem("appointment_current_user");
      if (currentUser !== storedUser) {
        localStorage.setItem("appointment_current_user", currentUser);
      }
    }
  }, [user, isAuthenticated]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isInitialized,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
