import { create } from "zustand";
import { persist } from "zustand/middleware";
import { User } from "@/types";
import { eventBus, EVENTS } from "./events";
import { QueryClient } from "@tanstack/react-query";

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

          const response = await fetch("/api/login", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ email, password, role }),
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || "Login failed");
          }

          const user = await response.json();
          console.log("✅ Login successful:", user);

          // Set the user in the auth state
          set({
            user: user,
            token: `token_${user.email}`, // Simple token for demo
            isAuthenticated: true,
          });
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
          set({
            user: user,
            token: `token_${user.email}`, // Simple token for demo
            isAuthenticated: true,
          });

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
        // TODO: Implement logout logic if needed
        set({
          user: null,
          token: null,
          isAuthenticated: false,
        });
      },

      initializeAuth: async () => {
        // TODO: Implement auth initialization logic if needed
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          isInitialized: true,
        });
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
