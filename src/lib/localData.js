// Local data storage for Doctor Appointment Management System
// This uses file-based storage via API routes following the specified API structure

// API endpoints - Updated to match the new API structure
const API_BASE = "/api/v1";

// In-memory data cache - synced with file storage
let currentData = {
  users: [],
  appointments: [],
  currentUser: null,
};

// Flag to track if data has been initialized
let isInitialized = false;

// Helper functions for API communication
async function callAPI(endpoint, options = {}) {
  const fullUrl = `${API_BASE}${endpoint}`;
  console.log(`🌐 Making API call to: ${fullUrl}`);
  console.log(`📤 Request options:`, options);

  try {
    const response = await fetch(fullUrl, {
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      ...options,
    });

    console.log(
      `📥 Response status: ${response.status} ${response.statusText}`
    );
    console.log(
      `📥 Response headers:`,
      Object.fromEntries(response.headers.entries())
    );

    if (!response.ok) {
      let errorMessage = "API call failed";
      const contentType = response.headers.get("content-type");

      try {
        if (contentType && contentType.includes("application/json")) {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } else {
          // If it's not JSON, read as text to see what we got
          const errorText = await response.text();
          console.log(`❌ Non-JSON response:`, errorText.substring(0, 200));
          errorMessage = `${response.status}: ${response.statusText}`;
        }
      } catch (parseError) {
        console.log(`❌ Error parsing response:`, parseError);
        errorMessage = `${response.status}: ${response.statusText}`;
      }
      throw new Error(errorMessage);
    }

    const responseData = await response.json();
    console.log(`✅ API call successful:`, responseData);
    return responseData;
  } catch (error) {
    console.error(`❌ API call failed for ${endpoint}:`, error);
    throw error;
  }
}

async function loadDataFromFile() {
  try {
    console.log("📁 Loading data from /api/storage...");
    const response = await fetch("/api/storage");
    console.log(
      "📁 Storage API response status:",
      response.status,
      response.statusText
    );

    if (!response.ok) {
      console.error("❌ Storage API failed with status:", response.status);
      throw new Error("Failed to load data from file");
    }

    const data = await response.json();
    console.log("📁 Storage API response data:", {
      users: (data.users || []).length,
      appointments: (data.appointments || []).length,
      currentUser: data.currentUser,
      hasCurrentUser: !!data.currentUser,
    });

    return data;
  } catch (error) {
    console.error("❌ Failed to load data from file:", error);
    return {
      users: [],
      appointments: [],
      currentUser: null,
    };
  }
}

// Initialize data if not already done
async function initializeData() {
  if (isInitialized) return;

  try {
    console.log("🔄 Initializing data from file storage...");

    // Load data from file via API
    const fileData = await loadDataFromFile();

    console.log("📁 Raw file data loaded:", {
      users: (fileData.users || []).length,
      appointments: (fileData.appointments || []).length,
      currentUser: fileData.currentUser,
      hasCurrentUser: !!fileData.currentUser,
    });

    // Set the current data
    currentData.users = fileData.users || [];
    currentData.appointments = fileData.appointments || [];
    currentData.currentUser = fileData.currentUser || null;

    console.log("💾 Memory data set to:", {
      users: currentData.users.length,
      appointments: currentData.appointments.length,
      currentUser: currentData.currentUser,
      hasCurrentUser: !!currentData.currentUser,
    });

    isInitialized = true;

    console.log(
      "📊 Data initialized from file with",
      currentData.users.length,
      "users (",
      currentData.users.filter((u) => u.role === "DOCTOR").length,
      "doctors,",
      currentData.users.filter((u) => u.role === "PATIENT").length,
      "patients) and",
      currentData.appointments.length,
      "appointments"
    );

    console.log("🔄 Data loaded from file storage:", {
      users: currentData.users.length,
      appointments: currentData.appointments.length,
      currentUser: !!currentData.currentUser,
      lastUpdated: fileData.lastUpdated,
    });
  } catch (error) {
    console.error("Failed to initialize data:", error);
    isInitialized = true; // Set to true to prevent infinite retries
  }
}

// User management
export const userAPI = {
  register: async (userData) => {
    console.log("🔄 Registering user with data:", userData);

    try {
      // Call the appropriate registration endpoint based on role
      const endpoint =
        userData.role === "DOCTOR"
          ? "/auth/register/doctor"
          : "/auth/register/patient";

      const response = await callAPI(endpoint, {
        method: "POST",
        body: JSON.stringify({
          email: userData.email,
          password: userData.password,
          name: userData.name,
          phone: userData.phone,
          ...(userData.role === "DOCTOR" && {
            specialization: userData.specialization,
            experience: userData.experience,
            qualification: userData.qualification,
            consultationFee: userData.consultationFee,
          }),
        }),
      });

      console.log("✅ User registered successfully:", response);
      return { success: true, data: response };
    } catch (error) {
      console.error("❌ User registration failed:", error);
      return { success: false, error: error.message };
    }
  },

  login: async (email, password) => {
    console.log("🔄 Attempting login for:", email);

    try {
      const response = await callAPI("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });

      console.log("✅ Login successful:", response);
      return { success: true, data: response };
    } catch (error) {
      console.error("❌ Login failed:", error);
      return { success: false, error: error.message };
    }
  },

  getCurrentUser: async () => {
    await initializeData();
    return currentData.currentUser;
  },

  logout: async () => {
    currentData.currentUser = null;
    console.log("🚪 User logged out");
    return { success: true };
  },
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
      return response;
    } catch (error) {
      console.error("❌ Failed to create appointment:", error);
      throw error;
    }
  },

  getPatientAppointments: async (params = {}) => {
    try {
      await initializeData();
      const currentUser = currentData.currentUser;

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
      // Fallback to local data
      await initializeData();
      const currentUser = currentData.currentUser;

      if (!currentUser) {
        throw new Error("User not authenticated");
      }

      let userAppointments = currentData.appointments.filter(
        (apt) => apt.patientId === currentUser.id
      );

      if (params.status) {
        userAppointments = userAppointments.filter(
          (apt) => apt.status === params.status
        );
      }

      userAppointments = userAppointments.map((apt) => {
        const doctor = currentData.users.find(
          (user) => user.id === apt.doctorId
        );
        return { ...apt, doctor };
      });

      const page = params.page || 1;
      const limit = params.limit || 10;
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedAppointments = userAppointments.slice(
        startIndex,
        endIndex
      );

      return {
        data: paginatedAppointments,
        pagination: {
          page,
          limit,
          total: userAppointments.length,
          totalPages: Math.ceil(userAppointments.length / limit),
        },
      };
    }
  },

  getDoctorAppointments: async (params = {}) => {
    try {
      console.log("🔄 getDoctorAppointments called with params:", params);

      await initializeData();

      console.log(
        "📊 After initializeData - currentData.currentUser:",
        currentData.currentUser
      );
      console.log("📊 After initializeData - isInitialized:", isInitialized);

      const currentUser = currentData.currentUser;

      if (!currentUser) {
        console.error(
          "❌ No current user found in memory after initialization"
        );
        console.error("📊 Full currentData:", currentData);
        throw new Error("User not authenticated");
      }

      console.log("✅ Current user found:", currentUser);

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
        `/appointments/doctor/${currentUser.id}${queryParams}`,
        {
          method: "GET",
        }
      );

      console.log("✅ Doctor appointments fetched successfully:", response);
      return response;
    } catch (error) {
      console.error("❌ Failed to fetch doctor appointments:", error);
      // Fallback to local data
      await initializeData();
      const currentUser = currentData.currentUser;

      if (!currentUser) {
        throw new Error("User not authenticated");
      }

      let doctorAppointments = currentData.appointments.filter(
        (apt) => apt.doctorId === currentUser.id
      );

      if (params.status) {
        doctorAppointments = doctorAppointments.filter(
          (apt) => apt.status === params.status
        );
      }

      if (params.date) {
        doctorAppointments = doctorAppointments.filter(
          (apt) => apt.date === params.date
        );
      }

      doctorAppointments = doctorAppointments.map((apt) => {
        const patient = currentData.users.find(
          (user) => user.id === apt.patientId
        );
        return { ...apt, patient };
      });

      doctorAppointments.sort((a, b) => new Date(b.date) - new Date(a.date));

      const page = params.page || 1;
      const limit = params.limit || 10;
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedAppointments = doctorAppointments.slice(
        startIndex,
        endIndex
      );

      return {
        data: paginatedAppointments,
        pagination: {
          page,
          limit,
          total: doctorAppointments.length,
          totalPages: Math.ceil(doctorAppointments.length / limit),
        },
      };
    }
  },

  updateStatus: async (appointmentId, status) => {
    console.log(`🔄 Updating appointment ${appointmentId} status to:`, status);

    try {
      const response = await callAPI("/appointments/update-status", {
        method: "POST",
        body: JSON.stringify({ appointmentId, status }),
      });

      console.log("✅ Appointment status updated successfully:", response);
      return response;
    } catch (error) {
      console.error("❌ Failed to update appointment status:", error);
      throw error;
    }
  },

  cancel: async (appointmentId) => {
    return appointmentAPI.updateStatus(appointmentId, "CANCELLED");
  },

  getById: async (appointmentId) => {
    console.log("Getting appointment by ID:", appointmentId);

    await initializeData();

    const appointment = currentData.appointments.find(
      (app) => app.id === appointmentId
    );

    if (!appointment) {
      throw new Error("Appointment not found");
    }

    // Get associated doctor and patient details
    const doctor = currentData.users.find(
      (user) => user.id === appointment.doctorId && user.role === "DOCTOR"
    );
    const patient = currentData.users.find(
      (user) => user.id === appointment.patientId && user.role === "PATIENT"
    );

    return {
      ...appointment,
      doctor: doctor || null,
      patient: patient || null,
    };
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
