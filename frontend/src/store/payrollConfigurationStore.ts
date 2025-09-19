import { create } from "zustand";
import type {
  PayrollConfiguration,
  PayrollConfigurationsByType,
  PayrollConfigurationApiResponse,
  PayrollConfigurationUpdate,
  PayrollConfigurationState,
  PayrollConfigurationValidation,
} from "@/models/payroll-configuration-model";
import axios from "axios";

/**
 * Payroll Configuration Store (2025 Schema)
 * Manages payroll configuration data with proper API integration
 * for Philippine compliance rates and complex holiday calculations
 */
export const usePayrollConfigurationStore = create<PayrollConfigurationState>(
  (set, get) => ({
    configurations: [],
    configurationsByType: {},
    loading: false,
    error: null,
    lastFetched: null,

    fetchConfigurations: async () => {
      try {
        set({ loading: true, error: null });

        const response = await axios.get<
          PayrollConfigurationApiResponse<{
            all: PayrollConfiguration[];
            byType: PayrollConfigurationsByType;
          }>
        >("/payroll-configuration/all");

        if (response.data.success && response.data.data) {
          console.log(
            "📊 Payroll configurations fetched:",
            response.data.data.all.length
          );
          set({
            configurations: response.data.data.all,
            configurationsByType: response.data.data.byType,
            lastFetched: new Date().toISOString(),
          });
        } else {
          throw new Error(
            response.data.message || "Failed to fetch configurations"
          );
        }
      } catch (error: any) {
        console.error("Error fetching payroll configurations:", error);
        set({
          error:
            error.response?.data?.message ||
            error.message ||
            "Failed to fetch configurations",
        });
      } finally {
        set({ loading: false });
      }
    },

    fetchActiveConfigurations: async (date?: string) => {
      try {
        set({ loading: true, error: null });

        const effectiveDate = date || new Date().toISOString().split("T")[0];
        const response = await axios.get<
          PayrollConfigurationApiResponse<PayrollConfigurationsByType>
        >(`/payroll-configuration/active?date=${effectiveDate}`);

        if (response.data.success && response.data.data) {
          console.log(
            "📊 Active configurations fetched for date:",
            effectiveDate
          );

          // Convert the organized data back to array format for consistency
          const configurationsArray: PayrollConfiguration[] = [];
          Object.entries(response.data.data).forEach(
            ([configType, configs]) => {
              Object.entries(configs).forEach(([configKey, configData]) => {
                configurationsArray.push({
                  config_id: 0, // Not provided in active endpoint
                  config_type: configType,
                  config_key: configKey,
                  config_value: configData.value,
                  effective_date: configData.effective_date,
                  expiry_date: configData.expiry_date,
                  description: configData.description,
                  is_active: true,
                  created_at: "",
                  updated_at: "",
                });
              });
            }
          );

          set({
            configurations: configurationsArray,
            configurationsByType: response.data.data,
            lastFetched: new Date().toISOString(),
          });
        } else {
          throw new Error(
            response.data.message || "Failed to fetch active configurations"
          );
        }
      } catch (error: any) {
        console.error("Error fetching active payroll configurations:", error);
        set({
          error:
            error.response?.data?.message ||
            error.message ||
            "Failed to fetch active configurations",
        });
      } finally {
        set({ loading: false });
      }
    },

    updateConfiguration: async (
      configType: string,
      configKey: string,
      value: number,
      effectiveDate?: string
    ) => {
      try {
        set({ loading: true, error: null });

        const updateData: PayrollConfigurationUpdate = {
          config_type: configType,
          config_key: configKey,
          config_value: value,
          effective_date:
            effectiveDate || new Date().toISOString().split("T")[0],
        };

        const response = await axios.put<
          PayrollConfigurationApiResponse<PayrollConfiguration>
        >("/payroll-configuration/update", updateData);

        if (response.data.success) {
          console.log(
            `✅ Configuration updated: ${configType}.${configKey} = ${value}`
          );

          // Update the local state
          const { configurations } = get();
          const updatedConfigurations = configurations.map((config) =>
            config.config_type === configType && config.config_key === configKey
              ? {
                  ...config,
                  config_value: value,
                  updated_at: new Date().toISOString(),
                }
              : config
          );

          // Update configurationsByType as well
          const { configurationsByType } = get();
          const updatedConfigsByType = { ...configurationsByType };
          if (updatedConfigsByType[configType]) {
            updatedConfigsByType[configType] = {
              ...updatedConfigsByType[configType],
              [configKey]: {
                ...updatedConfigsByType[configType][configKey],
                value: value,
              },
            };
          }

          set({
            configurations: updatedConfigurations,
            configurationsByType: updatedConfigsByType,
          });
        } else {
          throw new Error(
            response.data.message || "Failed to update configuration"
          );
        }
      } catch (error: any) {
        console.error("Error updating payroll configuration:", error);
        set({
          error:
            error.response?.data?.message ||
            error.message ||
            "Failed to update configuration",
        });
        throw error; // Re-throw for the component to handle
      } finally {
        set({ loading: false });
      }
    },

    bulkUpdateConfigurations: async (updates: PayrollConfigurationUpdate[]) => {
      try {
        set({ loading: true, error: null });

        const response = await axios.post<
          PayrollConfigurationApiResponse<PayrollConfiguration[]>
        >("/payroll-configuration/bulk", { configurations: updates });

        if (response.data.success) {
          console.log(
            `✅ Bulk update completed: ${updates.length} configurations`
          );

          // Refresh all configurations after bulk update
          await get().fetchConfigurations();
        } else {
          throw new Error(
            response.data.message || "Failed to bulk update configurations"
          );
        }
      } catch (error: any) {
        console.error("Error bulk updating payroll configurations:", error);
        set({
          error:
            error.response?.data?.message ||
            error.message ||
            "Failed to bulk update configurations",
        });
        throw error;
      } finally {
        set({ loading: false });
      }
    },

    initializeDefaultConfigurations: async () => {
      try {
        set({ loading: true, error: null });

        const response = await axios.post<
          PayrollConfigurationApiResponse<{ configurationsInitialized: number }>
        >("/payroll-configuration/initialize");

        if (response.data.success) {
          console.log("✅ Default configurations initialized");

          // Refresh configurations after initialization
          await get().fetchConfigurations();
        } else {
          throw new Error(
            response.data.message ||
              "Failed to initialize default configurations"
          );
        }
      } catch (error: any) {
        console.error("Error initializing default configurations:", error);
        set({
          error:
            error.response?.data?.message ||
            error.message ||
            "Failed to initialize configurations",
        });
        throw error;
      } finally {
        set({ loading: false });
      }
    },

    validateConfiguration: (
      configType: string,
      configKey: string,
      value: number
    ): PayrollConfigurationValidation => {
      const errors: string[] = [];
      const warnings: string[] = [];

      // Basic validation
      if (value < 0) {
        errors.push("Value cannot be negative");
      }

      // Type-specific validation
      switch (configType) {
        case "sss":
        case "philhealth":
        case "pagibig":
          if (configKey.includes("rate") && value > 1) {
            warnings.push(
              "Rate value seems high (>100%). Did you mean to enter a percentage?"
            );
          }
          if (configKey.includes("rate") && value > 0.5) {
            warnings.push(
              "Rate value is very high. Please verify this is correct."
            );
          }
          break;

        case "income_tax":
          if (configKey.includes("rate") && value > 0.5) {
            errors.push("Tax rate cannot exceed 50%");
          }
          break;

        case "overtime":
        case "holiday_pay":
          if (configKey.includes("rate") && value < 1) {
            errors.push("Premium rates should be 1.0 (100%) or higher");
          }
          if (configKey.includes("rate") && value > 5) {
            warnings.push("Rate seems unusually high. Please verify.");
          }
          break;

        case "night_differential":
          if (configKey === "rate" && (value < 0.05 || value > 0.5)) {
            warnings.push(
              "Night differential rate is typically between 5% and 50%"
            );
          }
          break;
      }

      return {
        isValid: errors.length === 0,
        errors,
        warnings,
        effectiveDate: new Date().toISOString().split("T")[0],
      };
    },

    clearError: () => {
      set({ error: null });
    },
  })
);

// Helper functions for configuration management
export const payrollConfigurationHelpers = {
  /**
   * Format a configuration value for display
   */
  formatConfigValue: (config: PayrollConfiguration): string => {
    if (config.config_key.includes("rate") && config.config_value < 1) {
      return `${(config.config_value * 100).toFixed(2)}%`;
    }
    if (
      config.config_key.includes("exemption") ||
      config.config_key.includes("limit") ||
      config.config_key.includes("min") ||
      config.config_key.includes("max")
    ) {
      return `₱${config.config_value.toLocaleString()}`;
    }
    return config.config_value.toString();
  },

  /**
   * Format a configuration key for display
   */
  formatConfigTitle: (configKey: string): string => {
    return configKey
      .replace(/_/g, " ")
      .replace(/\b\w/g, (l) => l.toUpperCase());
  },

  /**
   * Get the step value for input fields based on config key
   */
  getInputStep: (configKey: string): string => {
    if (configKey.includes("rate")) return "0.001";
    if (configKey.includes("amount") || configKey.includes("limit")) return "1";
    return "0.01";
  },

  /**
   * Get the input type based on config key
   */
  getInputType: (_configKey: string): string => {
    return "number"; // All configs are numeric in 2025 schema
  },

  /**
   * Check if a configuration is critical (affects legal compliance)
   */
  isCriticalConfig: (configType: string): boolean => {
    return ["sss", "philhealth", "pagibig", "income_tax"].includes(configType);
  },
};
