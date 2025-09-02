// Utility function to debug middleware behavior
export const logMiddlewareInfo = (
  pathname: string,
  isAuthenticated: boolean,
  userRole: string | null,
  action: string
) => {
  if (process.env.NODE_ENV === "development") {
    console.log(
      `[MIDDLEWARE] ${pathname} | Auth: ${isAuthenticated} | Role: ${userRole} | Action: ${action}`
    );
  }
};

// Helper function to get auth state from cookies (for debugging)
export const getAuthStateFromCookies = (
  cookies: string
): { isAuthenticated: boolean; userRole: string | null } => {
  try {
    const authCookie = cookies
      .split(";")
      .find((cookie) => cookie.trim().startsWith("auth-state="));

    if (!authCookie) {
      return { isAuthenticated: false, userRole: null };
    }

    const cookieValue = authCookie.split("=")[1];
    const decodedValue = decodeURIComponent(cookieValue);
    const authData = JSON.parse(decodedValue);

    return {
      isAuthenticated: authData.state?.isAuthenticated || false,
      userRole: authData.state?.user?.role || null,
    };
  } catch (error) {
    console.error("[MIDDLEWARE] Error parsing auth cookie:", error);
    return { isAuthenticated: false, userRole: null };
  }
};
