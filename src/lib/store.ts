import { create } from "zustand";
import { persist } from "zustand/middleware";
import { userAPI } from "./localData";
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
  register: (userData: Partial<User>) => Promise<void>;
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
          const response = await userAPI.login(email, password);
          console.log("Login successful, setting auth state:", response);

          if (response.success && response.data) {
            set({
              user: response.data.user,
              token: response.data.token,
              isAuthenticated: true,
            });
          } else {
            throw new Error(response.error || "Login failed");
          }
        } catch (error) {
          console.error("Login failed:", error);
          throw error;
        }
      },

      register: async (userData: Partial<User>) => {
        try {
          console.log("Registering user:", userData);
          const response = await userAPI.register(userData);
          console.log("Registration successful:", response);

          if (response.success && response.data) {
            set({
              user: response.data.user,
              token: response.data.token,
              isAuthenticated: true,
            });

            // If a doctor was registered, invalidate the doctors cache
            if (response.data.user.role === "DOCTOR") {
              console.log("Doctor registered, invalidating cache");
              // Emit event for real-time updates
              eventBus.emit(EVENTS.DOCTOR_REGISTERED, response.data.user);
              // Use a small delay to ensure the localStorage is fully updated
              setTimeout(() => {
                invalidateDoctorsCache();
                // Also force a window reload as a backup to ensure fresh data
                console.log("Doctor registered - cache invalidated");
              }, 200);
            }
          } else {
            throw new Error(response.error || "Registration failed");
          }
        } catch (error) {
          console.error("Registration failed:", error);
          throw error;
        }
      },

      logout: async () => {
        await userAPI.logout();
        set({
          user: null,
          token: null,
          isAuthenticated: false,
        });
      },

      initializeAuth: async () => {
        try {
          // First check if we have user data from Zustand persist storage
          const state = get();
          console.log("Current state from Zustand:", state);

          if (state.user && state.token) {
            // We have persisted auth data, use it
            console.log("Found persisted auth data in Zustand storage");
            set({
              isAuthenticated: true,
              isInitialized: true,
            });
            return;
          }

          // If no persisted data, check the file storage
          const currentUser = await userAPI.getCurrentUser();
          console.log("Checking file storage for current user:", currentUser);

          if (
            currentUser &&
            typeof currentUser === "object" &&
            "id" in currentUser
          ) {
            set({
              user: currentUser as User,
              token: `token_${(currentUser as User).id}`,
              isAuthenticated: true,
              isInitialized: true,
            });
          } else {
            // No auth data found anywhere
            set({
              user: null,
              token: null,
              isAuthenticated: false,
              isInitialized: true,
            });
          }
        } catch (error) {
          console.error("Failed to initialize auth:", error);
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
