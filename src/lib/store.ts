import { create } from "zustand";
import { persist } from "zustand/middleware";
import { User } from "@/types";
import { eventBus, EVENTS } from "./events";
import { QueryClient } from "@tanstack/react-query";

// Cookie utilities for middleware access
const setCookie = (name: string, value: string, days: number = 7) => {
  if (typeof document !== "undefined") {
    const expires = new Date();
    expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
    document.cookie = `${name}=${encodeURIComponent(
      value
    )};expires=${expires.toUTCString()};path=/;SameSite=Lax`;
  }
};

const deleteCookie = (name: string) => {
  if (typeof document !== "undefined") {
    document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;SameSite=Lax`;
  }
};

// Cache invalidation utilities
let globalQueryClient: QueryClient | null = null;

export const setGlobalQueryClient = (client: QueryClient) => {
  globalQueryClient = client;
};

export const getGlobalQueryClient = () => globalQueryClient;

const invalidateDoctorsCache = () => {
  if (globalQueryClient) {
    console.log("Invalidating doctors cache");
    globalQueryClient.removeQueries({ queryKey: ["doctors"] });
    globalQueryClient.invalidateQueries({ queryKey: ["doctors"] });
    globalQueryClient.refetchQueries({ queryKey: ["doctors"] });
  }
};

export const invalidateAppointmentsCache = () => {
  if (globalQueryClient) {
    globalQueryClient.invalidateQueries({ queryKey: ["appointments"] });
  }
};

export const invalidateAllCache = () => {
  if (globalQueryClient) {
    globalQueryClient.invalidateQueries();
  }
};

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isInitialized: boolean;
  login: (
    email: string,
    password: string,
    role: "DOCTOR" | "PATIENT"
  ) => Promise<void>;
  register: (userData: Partial<User> & { password?: string }) => Promise<void>;
  logout: () => Promise<void>;
  initializeAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isInitialized: false,

      login: async (
        email: string,
        password: string,
        role: "DOCTOR" | "PATIENT"
      ) => {
        try {
          console.log("🔄 Attempting login for:", email, role);
          console.log("🌐 Making fetch request to /api/login");

          const response = await fetch("/api/login", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ email, password, role }),
          });

          console.log(
            "📡 Response received:",
            response.status,
            response.statusText
          );

          if (!response.ok) {
            const errorData = await response.json();
            console.error("❌ API Error:", errorData);
            throw new Error(errorData.error || "Login failed");
          }

          const user = await response.json();
          console.log("✅ Login successful:", user);

          // Set the user in the auth state
          const authData = {
            user: user,
            token: `token_${user.email}`, // Simple token for demo
            isAuthenticated: true,
            isInitialized: true, // Make sure initialization flag is set
          };

          set(authData);

          // Set auth state in cookies for middleware access
          const cookieData = JSON.stringify({
            state: authData,
          });

          console.log("🍪 Setting cookie with data:", cookieData);
          setCookie("auth-state", cookieData);

          // Force immediate cookie setting
          if (typeof document !== "undefined") {
            const expires = new Date();
            expires.setTime(expires.getTime() + 7 * 24 * 60 * 60 * 1000);
            document.cookie = `auth-state=${encodeURIComponent(
              cookieData
            )};expires=${expires.toUTCString()};path=/;SameSite=Lax`;
            console.log("🍪 Cookie set directly via document.cookie");
          }

          // Verify cookie was set
          setTimeout(() => {
            const testCookie = document.cookie
              .split(";")
              .find((cookie) => cookie.trim().startsWith("auth-state="));
            console.log(
              "🍪 Cookie verification:",
              testCookie ? "Found" : "Not found"
            );
            if (testCookie) {
              console.log(
                "🍪 Cookie content preview:",
                testCookie.substring(0, 50) + "..."
              );
            }
          }, 50);

          console.log("🍪 Cookie set:", cookieData);

          // Small delay to ensure all state is synchronized
          await new Promise((resolve) => setTimeout(resolve, 100));
        } catch (error) {
          console.error("❌ Login failed:", error);
          throw error;
        }
      },

      register: async (userData: Partial<User> & { password?: string }) => {
        try {
          console.log("🔄 Registering user with data:", userData);

          const response = await fetch("/api/register", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              name: userData.name,
              email: userData.email,
              password: userData.password,
              role: userData.role,
              specialization: userData.specialization,
              photo_url: userData.photo_url,
            }),
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || "Registration failed");
          }

          const user = await response.json();
          console.log("✅ User registered successfully:", user);

          // Set the user in the auth state
          const authData = {
            user: user,
            token: `token_${user.email}`, // Simple token for demo
            isAuthenticated: true,
            isInitialized: true, // Make sure initialization flag is set
          };

          set(authData);

          // Set auth state in cookies for middleware access
          const cookieData = JSON.stringify({
            state: authData,
          });
          setCookie("auth-state", cookieData);

          // If a doctor was registered, invalidate the doctors cache
          if (user.role === "DOCTOR") {
            console.log("Doctor registered, invalidating cache");
            // Emit event for real-time updates
            eventBus.emit(EVENTS.DOCTOR_REGISTERED, user);
            // Use a small delay to ensure the state is fully updated
            setTimeout(() => {
              invalidateDoctorsCache();
              console.log("Doctor registered - cache invalidated");
            }, 200);
          }
        } catch (error) {
          console.error("❌ User registration failed:", error);
          throw error;
        }
      },

      logout: async () => {
        // Clear auth state
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          isInitialized: true, // Keep initialized state
        });

        // Remove auth state from cookies
        deleteCookie("auth-state");
      },

      initializeAuth: async () => {
        try {
          console.log("🔄 Initializing auth...");

          // Check if there's already authentication data in the store
          const currentState = get();
          if (currentState.user && currentState.isAuthenticated) {
            console.log(
              "✅ Auth already available in store:",
              currentState.user
            );
            set({ isInitialized: true });
            return;
          }

          // Check cookies for auth state
          if (typeof document !== "undefined") {
            const authCookie = document.cookie
              .split(";")
              .find((cookie) => cookie.trim().startsWith("auth-state="));

            if (authCookie) {
              try {
                const cookieValue = authCookie.split("=")[1];
                const decodedValue = decodeURIComponent(cookieValue);
                const authData = JSON.parse(decodedValue);

                if (
                  authData.state &&
                  authData.state.user &&
                  authData.state.isAuthenticated
                ) {
                  console.log(
                    "✅ Auth restored from cookie:",
                    authData.state.user
                  );
                  set({
                    user: authData.state.user,
                    token: authData.state.token,
                    isAuthenticated: authData.state.isAuthenticated,
                    isInitialized: true,
                  });
                  return;
                }
              } catch (error) {
                console.error("❌ Error parsing auth cookie:", error);
              }
            }
          }

          // No auth data found, set as unauthenticated
          console.log("ℹ️ No auth data found, initializing as unauthenticated");
          set({
            user: null,
            token: null,
            isAuthenticated: false,
            isInitialized: true,
          });
        } catch (error) {
          console.error("❌ Error during auth initialization:", error);
          set({
            user: null,
            token: null,
            isAuthenticated: false,
            isInitialized: true,
          });
        }
      },
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
        // isInitialized is not persisted as it's a runtime state
      }),
      onRehydrateStorage: () => (state) => {
        console.log("🔄 Rehydrating auth storage:", state);

        // Mark as initialized when store is rehydrated
        if (state) {
          state.isInitialized = true;
        }

        // Sync with cookies when store is rehydrated
        if (state && state.isAuthenticated && state.user) {
          console.log("✅ Rehydrated authenticated state, syncing cookie");
          setCookie(
            "auth-state",
            JSON.stringify({
              state: {
                user: state.user,
                token: state.token,
                isAuthenticated: state.isAuthenticated,
              },
            })
          );
        } else {
          console.log("ℹ️ Rehydrated unauthenticated state");
        }
      },
    }
  )
);

interface AppState {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  sidebarOpen: false,
  setSidebarOpen: (open: boolean) => set({ sidebarOpen: open }),
  toggleSidebar: () => set({ sidebarOpen: !get().sidebarOpen }),
}));
