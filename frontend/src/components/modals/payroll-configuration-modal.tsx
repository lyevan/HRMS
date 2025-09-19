import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Save, RotateCcw, Calendar, Info } from "lucide-react";
import {
  usePayrollConfigurationStore,
  payrollConfigurationHelpers,
} from "@/store/payrollConfigurationStore";
import type {
  PayrollConfiguration,
  PayrollConfigurationModalProps,
  PayrollConfigurationFormData,
  PayrollConfigurationSection,
} from "@/models/payroll-configuration-model";

export function PayrollConfigurationModal({
  open,
  onOpenChange,
  onUpdateConfig,
  loading = false,
}: PayrollConfigurationModalProps) {
  const {
    configurations,
    loading: configLoading,
    error,
    fetchConfigurations,
    updateConfiguration,
    clearError,
  } = usePayrollConfigurationStore();

  const [formData, setFormData] = useState<PayrollConfigurationFormData>({});
  const [hasChanges, setHasChanges] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Fetch configurations when modal opens
  useEffect(() => {
    if (open) {
      fetchConfigurations();
    }
  }, [open, fetchConfigurations]);

  // Initialize form data when configurations load
  useEffect(() => {
    if (configurations.length > 0) {
      const initialData: PayrollConfigurationFormData = {};
      configurations.forEach((config) => {
        initialData[`${config.config_type}.${config.config_key}`] = String(
          config.config_value
        );
      });
      setFormData(initialData);
      setHasChanges(false);
    }
  }, [configurations]);

  // Clear error when modal closes
  useEffect(() => {
    if (!open) {
      clearError();
      setHasChanges(false);
    }
  }, [open, clearError]);

  const handleInputChange = (
    configType: string,
    configKey: string,
    value: string
  ) => {
    const fullKey = `${configType}.${configKey}`;
    setFormData((prev) => ({
      ...prev,
      [fullKey]: value,
    }));
    setHasChanges(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      // Process changes using the new store method
      for (const config of configurations) {
        const fullKey = `${config.config_type}.${config.config_key}`;
        const newValue = formData[fullKey];
        if (
          newValue !== undefined &&
          parseFloat(newValue) !== config.config_value
        ) {
          await updateConfiguration(
            config.config_type,
            config.config_key,
            parseFloat(newValue)
          );

          // Also call the parent's onUpdateConfig for backward compatibility
          await onUpdateConfig(
            config.config_type,
            config.config_key,
            parseFloat(newValue)
          );
        }
      }

      setHasChanges(false);
    } catch (error) {
      console.error("Failed to update configurations:", error);
      // Error is already handled by the store
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    const initialData: PayrollConfigurationFormData = {};
    configurations.forEach((config) => {
      initialData[`${config.config_type}.${config.config_key}`] = String(
        config.config_value
      );
    });
    setFormData(initialData);
    setHasChanges(false);
  };

  // Group configurations by type for 2025 structure
  const configSections: PayrollConfigurationSection[] = [
    {
      title: "SSS Contributions",
      description:
        "Social Security System contribution rates and limits for 2025",
      icon: <Calendar className="h-4 w-4" />,
      configs: configurations.filter((c) => c.config_type === "sss"),
    },
    {
      title: "PhilHealth Contributions",
      description:
        "PhilHealth Universal Healthcare Act 2025 rates (5.5% total)",
      icon: <Calendar className="h-4 w-4" />,
      configs: configurations.filter((c) => c.config_type === "philhealth"),
    },
    {
      title: "Pag-IBIG Contributions",
      description:
        "Housing Development Mutual Fund 2025 rates with enhanced tiers",
      icon: <Calendar className="h-4 w-4" />,
      configs: configurations.filter((c) => c.config_type === "pagibig"),
    },
    {
      title: "Income Tax Brackets",
      description: "TRAIN Law 2025 tax brackets with inflation adjustments",
      icon: <Calendar className="h-4 w-4" />,
      configs: configurations.filter((c) => c.config_type === "income_tax"),
    },
    {
      title: "13th Month Pay",
      description: "13th month pay calculation settings for 2025",
      icon: <Calendar className="h-4 w-4" />,
      configs: configurations.filter(
        (c) => c.config_type === "thirteenth_month"
      ),
    },
    {
      title: "Holiday Pay Rates",
      description: "Regular and special holiday pay multipliers for 2025",
      icon: <Calendar className="h-4 w-4" />,
      configs: configurations.filter((c) => c.config_type === "holiday_pay"),
    },
    {
      title: "Overtime Rates",
      description: "Overtime pay multipliers and thresholds for 2025",
      icon: <Calendar className="h-4 w-4" />,
      configs: configurations.filter((c) => c.config_type === "overtime"),
    },
    {
      title: "Night Differential",
      description: "Night differential rates and time settings for 2025",
      icon: <Calendar className="h-4 w-4" />,
      configs: configurations.filter(
        (c) => c.config_type === "night_differential"
      ),
    },
  ].filter((section) => section.configs.length > 0);

  const renderConfigInput = (config: PayrollConfiguration) => {
    const fullKey = `${config.config_type}.${config.config_key}`;
    const value = formData[fullKey] || "";

    return (
      <Input
        type="number"
        step={payrollConfigurationHelpers.getInputStep(config.config_key)}
        value={value}
        onChange={(e) =>
          handleInputChange(
            config.config_type,
            config.config_key,
            e.target.value
          )
        }
        placeholder={`Enter ${config.config_key.replace(/_/g, " ")}`}
      />
    );
  };

  // Show error if there's one
  if (error) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Configuration Error</DialogTitle>
            <DialogDescription>
              There was an error loading the payroll configurations.
            </DialogDescription>
          </DialogHeader>
          <div className="bg-red-50 border-l-4 border-red-400 p-4">
            <div className="flex">
              <Info className="h-5 w-5 text-red-400 flex-shrink-0" />
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">
                  Error Details
                </h3>
                <p className="mt-2 text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => onOpenChange(false)}>Close</Button>
            <Button
              onClick={() => {
                clearError();
                fetchConfigurations();
              }}
              variant="outline"
            >
              Retry
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[1000px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>2025 Philippine Payroll Configuration</DialogTitle>
          <DialogDescription>
            Configure 2025 Philippine payroll compliance rates. All rates are
            effective January 1, 2025.
          </DialogDescription>
        </DialogHeader>

        {/* 2025 Compliance Notice */}
        <div className="bg-green-50 border-l-4 border-green-400 p-4 mb-6">
          <div className="flex">
            <Info className="h-5 w-5 text-green-400 flex-shrink-0" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-green-800">
                Philippine Law Compliance (2025 Updates)
              </h3>
              <div className="mt-2 text-sm text-green-700">
                <ul className="list-disc list-inside space-y-1">
                  <li>
                    <strong>SSS:</strong> Updated contribution rates effective
                    2025
                  </li>
                  <li>
                    <strong>PhilHealth:</strong> 5.5% total rate (2.75% each) -
                    UHC Act implementation
                  </li>
                  <li>
                    <strong>Pag-IBIG:</strong> Enhanced tiers with 2.5% rate for
                    high earners
                  </li>
                  <li>
                    <strong>Income Tax:</strong> TRAIN Law with 2025 inflation
                    adjustments, new 32% bracket
                  </li>
                  <li>
                    <strong>13th Month Pay:</strong> Enhanced calculation with
                    ₱90,000 tax exemption
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {configLoading || loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
              <p>Loading 2025 configurations...</p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <Tabs
              defaultValue={configSections[0]?.title
                .toLowerCase()
                .replace(/\s+/g, "-")}
              className="w-full"
            >
              <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4 mb-6 h-auto">
                {configSections.map((section) => (
                  <TabsTrigger
                    key={section.title}
                    value={section.title.toLowerCase().replace(/\s+/g, "-")}
                    className="text-xs p-2 h-auto flex-col gap-1"
                  >
                    {section.icon}
                    <span className="text-center leading-tight">
                      {section.title}
                    </span>
                  </TabsTrigger>
                ))}
              </TabsList>

              {configSections.map((section) => (
                <TabsContent
                  key={section.title}
                  value={section.title.toLowerCase().replace(/\s+/g, "-")}
                  className="space-y-4"
                >
                  <div>
                    <h3 className="text-lg font-medium">{section.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      {section.description}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {section.configs.map((config) => (
                      <div
                        key={`${config.config_type}.${config.config_key}`}
                        className="space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <Label className="text-sm font-medium">
                            {payrollConfigurationHelpers.formatConfigTitle(
                              config.config_key
                            )}
                          </Label>
                          <Badge variant="outline" className="text-xs">
                            Current:{" "}
                            {payrollConfigurationHelpers.formatConfigValue(
                              config
                            )}
                          </Badge>
                        </div>
                        {renderConfigInput(config)}
                        {config.description && (
                          <p className="text-xs text-muted-foreground">
                            {config.description}
                          </p>
                        )}
                        <p className="text-xs text-blue-600">
                          Effective:{" "}
                          {new Date(config.effective_date).toLocaleDateString()}
                        </p>
                      </div>
                    ))}
                  </div>
                </TabsContent>
              ))}
            </Tabs>

            <DialogFooter className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={submitting}
              >
                Cancel
              </Button>
              {hasChanges && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleReset}
                  disabled={submitting}
                >
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Reset
                </Button>
              )}
              <Button type="submit" disabled={!hasChanges || submitting}>
                {submitting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                <Save className="mr-2 h-4 w-4" />
                {submitting ? "Saving..." : "Save 2025 Changes"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
