// All user management is now handled via MongoDB and API routes.
// Remove all local storage, file, and in-memory logic.

// API utility function
const callAPI = async (endpoint, options = {}) => {
  console.log(`Making API call to: /api${endpoint}`, options);

  // Get auth cookie manually to ensure it's sent
  let authCookie = null;
  if (typeof document !== "undefined") {
    const cookies = document.cookie.split(";");
    const authStateCookie = cookies.find((cookie) =>
      cookie.trim().startsWith("auth-state=")
    );
    const authSessionCookie = cookies.find((cookie) =>
      cookie.trim().startsWith("auth-session=")
    );

    authCookie = authStateCookie || authSessionCookie;
    console.log("Found auth cookie:", !!authCookie);
    console.log("All document cookies:", document.cookie);
  }

  const defaultOptions = {
    credentials: "include", // Include cookies for authentication
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  };

  const config = { ...defaultOptions, ...options };

  try {
    const response = await fetch(`/api${endpoint}`, config);

    console.log(`API response status: ${response.status} for ${endpoint}`);

    if (!response.ok) {
      const errorData = await response
        .json()
        .catch(() => ({ error: response.statusText }));
      console.error(`API Error for ${endpoint}:`, errorData);
      throw new Error(
        errorData.error || `HTTP ${response.status}: ${response.statusText}`
      );
    }

    return await response.json();
  } catch (error) {
    console.error(`API call failed for ${endpoint}:`, error);
    throw error;
  }
};

// Doctor management
export const doctorAPI = {
  getAll: async (params = {}) => {
    console.log("Getting all doctors with params:", params);

    try {
      let queryParams = "";
      if (
        params.search ||
        params.specialization ||
        params.page ||
        params.limit
      ) {
        const urlParams = new URLSearchParams();
        if (params.search) urlParams.append("search", params.search);
        if (params.specialization)
          urlParams.append("specialization", params.specialization);
        if (params.page) urlParams.append("page", params.page);
        if (params.limit) urlParams.append("limit", params.limit);
        queryParams = `?${urlParams.toString()}`;
      }

      const response = await callAPI(`/doctors${queryParams}`, {
        method: "GET",
      });

      console.log("✅ Doctors fetched successfully:", response);
      return response;
    } catch (error) {
      console.error("❌ Failed to fetch doctors:", error);
      // Fallback to local data
      await initializeData();
      let doctors = currentData.users.filter((user) => user.role === "DOCTOR");

      // Apply filters and pagination locally
      if (params.search) {
        doctors = doctors.filter(
          (doctor) =>
            doctor.name.toLowerCase().includes(params.search.toLowerCase()) ||
            doctor.specialization
              .toLowerCase()
              .includes(params.search.toLowerCase())
        );
      }

      if (params.specialization) {
        doctors = doctors.filter(
          (doctor) => doctor.specialization === params.specialization
        );
      }

      const page = params.page || 1;
      const limit = params.limit || 6;
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedDoctors = doctors.slice(startIndex, endIndex);

      return {
        data: paginatedDoctors,
        pagination: {
          page,
          limit,
          total: doctors.length,
          totalPages: Math.ceil(doctors.length / limit),
        },
      };
    }
  },

  getById: async (id) => {
    await initializeData();
    return currentData.users.find(
      (user) => user.id === id && user.role === "DOCTOR"
    );
  },

  getAvailableSpecializations: async () => {
    try {
      const response = await callAPI("/specializations", {
        method: "GET",
      });

      console.log("✅ Specializations fetched successfully:", response);
      return response;
    } catch (error) {
      console.error("❌ Failed to fetch specializations:", error);
      // Fallback to static list
      return {
        data: [
          "Cardiology",
          "Dermatology",
          "Pediatrics",
          "Orthopedics",
          "Neurology",
          "Psychiatry",
          "Internal Medicine",
          "Family Medicine",
          "Emergency Medicine",
          "Anesthesiology",
        ],
      };
    }
  },
};

// Appointment management
export const appointmentAPI = {
  create: async (appointmentData) => {
    console.log("Creating appointment with data:", appointmentData);

    try {
      const response = await callAPI("/appointments", {
        method: "POST",
        body: JSON.stringify(appointmentData),
      });

      console.log("✅ Appointment created successfully:", response);
      return response.data;
    } catch (error) {
      console.error("❌ Failed to create appointment:", error);
      throw error;
    }
  },

  getPatientAppointments: async (params = {}) => {
    try {
      // Get current user from auth store (check both cookie names)
      let authCookie = document.cookie
        .split(";")
        .find((cookie) => cookie.trim().startsWith("auth-state="));

      if (!authCookie) {
        authCookie = document.cookie
          .split(";")
          .find((cookie) => cookie.trim().startsWith("auth-session="));
      }

      if (!authCookie) {
        throw new Error("User not authenticated");
      }

      const cookieValue = authCookie.split("=")[1];
      const decodedValue = decodeURIComponent(cookieValue);
      let currentUser;

      try {
        const authData = JSON.parse(decodedValue);

        // Handle both cookie formats
        if (authCookie.includes("auth-session=")) {
          // Direct user data format
          currentUser = authData.user;
        } else {
          // Nested state format
          currentUser = authData.state?.user;
        }
      } catch (parseError) {
        console.error("Error parsing auth cookie:", parseError);
        throw new Error("Invalid authentication data");
      }

      if (!currentUser) {
        throw new Error("User not authenticated");
      }

      let queryParams = "";
      if (params.status || params.page || params.limit) {
        const urlParams = new URLSearchParams();
        if (params.status) urlParams.append("status", params.status);
        if (params.page) urlParams.append("page", params.page);
        if (params.limit) urlParams.append("limit", params.limit);
        queryParams = `?${urlParams.toString()}`;
      }

      const response = await callAPI(
        `/appointments/patient/${currentUser.id}${queryParams}`,
        {
          method: "GET",
        }
      );

      console.log("✅ Patient appointments fetched successfully:", response);
      return response;
    } catch (error) {
      console.error("❌ Failed to fetch patient appointments:", error);
      throw error;
    }
  },

  getDoctorAppointments: async (params = {}) => {
    try {
      console.log("🔄 getDoctorAppointments called with params:", params);

      // Use doctorId from params (required now)
      if (!params.doctorId) {
        throw new Error("Doctor ID is required");
      }

      const targetDoctorId = params.doctorId;

      console.log("🎯 Target doctor ID:", targetDoctorId);

      let queryParams = "";
      if (params.status || params.date || params.page || params.limit) {
        const urlParams = new URLSearchParams();
        if (params.status) urlParams.append("status", params.status);
        if (params.date) urlParams.append("date", params.date);
        if (params.page) urlParams.append("page", params.page);
        if (params.limit) urlParams.append("limit", params.limit);
        queryParams = `?${urlParams.toString()}`;
      }

      const response = await callAPI(
        `/appointments/doctor/${targetDoctorId}${queryParams}`,
        {
          method: "GET",
        }
      );

      console.log("✅ Doctor appointments fetched successfully:", response);
      return response;
    } catch (error) {
      console.error("❌ Failed to fetch doctor appointments:", error);
      throw error;
    }
  },

  updateStatus: async (appointmentId, status) => {
    console.log(`🔄 Updating appointment ${appointmentId} status to:`, status);

    try {
      const response = await callAPI(`/appointments/${appointmentId}`, {
        method: "PUT",
        body: JSON.stringify({ status }),
      });

      console.log("✅ Appointment status updated successfully:", response);
      return response.data;
    } catch (error) {
      console.error("❌ Failed to update appointment status:", error);
      throw error;
    }
  },

  cancel: async (appointmentId) => {
    console.log(`🔄 Cancelling appointment ${appointmentId}`);

    try {
      const response = await callAPI(`/appointments/${appointmentId}`, {
        method: "DELETE",
      });

      console.log("✅ Appointment cancelled successfully:", response);
      return response.data;
    } catch (error) {
      console.error("❌ Failed to cancel appointment:", error);
      throw error;
    }
  },

  getById: async (appointmentId) => {
    console.log("Getting appointment by ID:", appointmentId);

    try {
      const response = await callAPI(`/appointments/${appointmentId}`, {
        method: "GET",
      });

      console.log("✅ Appointment fetched successfully:", response);
      return response.data;
    } catch (error) {
      console.error("❌ Failed to fetch appointment:", error);
      throw error;
    }
  },
};

// Health check
export const healthAPI = {
  check: async () => {
    return { status: "OK", message: "File-based data API is working" };
  },
};

// Combined data API for admin access
export const dataAPI = {
  getAllUsers: async () => {
    await initializeData();
    return [...currentData.users];
  },
  getAllAppointments: async () => {
    await initializeData();
    return [...currentData.appointments];
  },
  getCurrentUser: async () => {
    await initializeData();
    return currentData.currentUser;
  },
  getStats: async () => {
    await initializeData();
    const doctors = currentData.users.filter((u) => u.role === "DOCTOR");
    const patients = currentData.users.filter((u) => u.role === "PATIENT");
    return {
      totalUsers: currentData.users.length,
      totalDoctors: doctors.length,
      totalPatients: patients.length,
      totalAppointments: currentData.appointments.length,
      pendingAppointments: currentData.appointments.filter(
        (apt) => apt.status === "PENDING"
      ).length,
      confirmedAppointments: currentData.appointments.filter(
        (apt) => apt.status === "COMPLETED"
      ).length,
    };
  },
  resetData: async () => {
    try {
      await callAPI("resetData");

      // Clear local cache and reinitialize
      isInitialized = false;
      await initializeData();

      return {
        success: true,
        message: "Data reset to initial state, file updated",
      };
    } catch (error) {
      console.error("❌ Reset data failed:", error);
      throw error;
    }
  },
  clearData: async () => {
    try {
      await callAPI("clearData");

      // Clear local cache
      currentData.users = [];
      currentData.appointments = [];
      currentData.currentUser = null;

      return {
        success: true,
        message: "All data cleared from file storage",
      };
    } catch (error) {
      console.error("❌ Clear data failed:", error);
      throw error;
    }
  },

  getStorageData: async () => {
    const fileData = await loadDataFromFile();

    return {
      fileStorage: {
        users: fileData.users || [],
        appointments: fileData.appointments || [],
        currentUser: fileData.currentUser || null,
        lastUpdated: fileData.lastUpdated,
      },
      memory: {
        users: currentData.users,
        appointments: currentData.appointments,
        currentUser: currentData.currentUser,
      },
      summary: {
        file_users_count: (fileData.users || []).length,
        file_appointments_count: (fileData.appointments || []).length,
        memory_users_count: currentData.users.length,
        memory_appointments_count: currentData.appointments.length,
        has_current_user: !!currentData.currentUser,
      },
    };
  },

  // Debug function to log all data
  logAllData: async () => {
    const fileData = await loadDataFromFile();

    const data = {
      fileStorage: {
        users: fileData.users || [],
        appointments: fileData.appointments || [],
        currentUser: fileData.currentUser || null,
        lastUpdated: fileData.lastUpdated,
      },
      memory: {
        users: currentData.users,
        appointments: currentData.appointments,
        currentUser: currentData.currentUser,
      },
      summary: {
        file_users_count: (fileData.users || []).length,
        file_appointments_count: (fileData.appointments || []).length,
        memory_users_count: currentData.users.length,
        memory_appointments_count: currentData.appointments.length,
        has_current_user: !!currentData.currentUser,
      },
    };

    console.log("📊 Complete Data Overview:", data);
    console.log(
      "🏥 All Doctors:",
      currentData.users.filter((u) => u.role === "DOCTOR")
    );
    console.log(
      "👥 All Patients:",
      currentData.users.filter((u) => u.role === "PATIENT")
    );
    console.log("📅 All Appointments:", currentData.appointments);
    return data;
  },
};

// Admin API - alias for dataAPI for backward compatibility
export const adminAPI = dataAPI;

// Debug utilities - expose data access functions globally for browser console
if (typeof window !== "undefined") {
  window.debugAppointmentSystem = {
    getData: async () => {
      await initializeData();
      return {
        users: [...currentData.users],
        appointments: [...currentData.appointments],
        currentUser: currentData.currentUser,
        isInitialized,
      };
    },
    reset: async () => {
      try {
        await callAPI("resetData");
        isInitialized = false;
        await initializeData();
        console.log("Debug: Data reset to initial state");
      } catch (error) {
        console.error("Debug reset failed:", error);
      }
    },
    clearAll: async () => {
      try {
        await callAPI("clearData");
        currentData.users = [];
        currentData.appointments = [];
        currentData.currentUser = null;
        console.log("Debug: All data cleared");
      } catch (error) {
        console.error("Debug clear failed:", error);
      }
    },
    viewUsers: async () => {
      await initializeData();
      console.log("All users:", currentData.users);
      return currentData.users;
    },
    viewDoctors: async () => {
      await initializeData();
      const doctors = currentData.users.filter((u) => u.role === "DOCTOR");
      console.log("All doctors:", doctors);
      return doctors;
    },
    viewAppointments: async () => {
      await initializeData();
      console.log("All appointments:", currentData.appointments);
      return currentData.appointments;
    },
    viewCurrentUser: () => {
      console.log("Current user:", currentData.currentUser);
      return currentData.currentUser;
    },
    viewFileData: async () => {
      const fileData = await loadDataFromFile();
      console.log("File data:", fileData);
      return fileData;
    },
  };

  // Make adminAPI available globally for debugging in browser console
  window.adminAPI = adminAPI;
  window.debugData = () => adminAPI.logAllData();
  console.log(
    "🔧 Debug functions available: window.adminAPI, window.debugData(), and window.debugAppointmentSystem"
  );
}
