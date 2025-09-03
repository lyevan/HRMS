// Environment configuration utility
export const config = {
  api: {
    baseUrl: import.meta.env.VITE_API_BASE_URL || "http://192.168.0.109:3000/api",
  },
  app: {
    name: import.meta.env.VITE_APP_NAME || "HRMS",
    environment: import.meta.env.VITE_NODE_ENV || "development",
  },
  isDevelopment: import.meta.env.VITE_NODE_ENV === "development",
  isProduction: import.meta.env.VITE_NODE_ENV === "production",
} as const;

// Validate required environment variables
const requiredEnvVars = ["VITE_API_BASE_URL"] as const;

export const validateEnvironment = () => {
  const missing = requiredEnvVars.filter((key) => !import.meta.env[key]);

  if (missing.length > 0) {
    console.warn(
      `Missing environment variables: ${missing.join(", ")}. Using defaults.`
    );
  }
};

export default config;
