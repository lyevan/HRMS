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
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Eye } from "lucide-react";
import { format } from "date-fns";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MultiSelectCombobox } from "@/components/ui/multi-select-combobox";
import { useEmployeeStore } from "@/store/employeeStore";
import { useDepartmentStore } from "@/store/departmentStore";
import { useAttendanceStore } from "@/store/attendanceStore";
import type { CreatePayrollHeader } from "@/models/payroll-model";
import type { TimesheetResponse } from "@/models/attendance-model";
import TimesheetViewModal from "./timesheet-view-modal";

interface PayrollGenerationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onGenerate: (data: CreatePayrollHeader) => Promise<void>;
  loading?: boolean;
}

export function PayrollGenerationModal({
  open,
  onOpenChange,
  onGenerate,
  loading = false,
}: PayrollGenerationModalProps) {
  const [formData, setFormData] = useState({
    generation_type: "all_employees" as
      | "all_employees"
      | "selected_employees"
      | "by_department",
    timesheet_id: null as number | null,
    start_date: "",
    end_date: "",
    employee_ids: [] as string[],
    department_ids: [] as number[],
    notes: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [viewTimesheetModalOpen, setViewTimesheetModalOpen] = useState(false);
  const [selectedViewTimesheet, setSelectedViewTimesheet] =
    useState<TimesheetResponse | null>(null);

  // Use real stores instead of hardcoded data
  const { employees, fetchEmployees } = useEmployeeStore();
  const { departments, fetchDepartments } = useDepartmentStore();
  const { unconsumedTimesheets, fetchUnconsumedTimesheets } =
    useAttendanceStore(); // Fetch real data when modal opens
  useEffect(() => {
    if (open) {
      fetchEmployees();
      fetchDepartments();
      fetchUnconsumedTimesheets();
    }
  }, [open, fetchEmployees, fetchDepartments, fetchUnconsumedTimesheets]);

  // Auto-set dates based on selected timesheet
  useEffect(() => {
    console.log("Date auto-populate effect triggered:");
    console.log("- timesheet_id:", formData.timesheet_id);
    console.log("- unconsumedTimesheets:", unconsumedTimesheets);

    if (formData.timesheet_id) {
      const selectedTimesheet = unconsumedTimesheets.find(
        (ts) => Number(ts.timesheet_id) === Number(formData.timesheet_id)
      );

      console.log("- selectedTimesheet found:", selectedTimesheet);

      if (selectedTimesheet) {
        console.log(
          "- Setting dates:",
          selectedTimesheet.start_date,
          "to",
          selectedTimesheet.end_date
        );
        setFormData((prev) => ({
          ...prev,
          start_date: selectedTimesheet.start_date,
          end_date: selectedTimesheet.end_date,
        }));
      } else {
        console.log("❌ No timesheet found with ID:", formData.timesheet_id);
      }
    }
  }, [formData.timesheet_id, unconsumedTimesheets]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    console.log("Validation check - formData:", formData);

    if (!formData.timesheet_id) {
      console.log("❌ Validation failed: No timesheet_id");
      newErrors.timesheet_id = "Please select a timesheet";
    } else {
      console.log("✅ timesheet_id is valid:", formData.timesheet_id);
    }

    // start_date and end_date should be automatically set from timesheet selection
    // No need to validate them separately since they come from the timesheet

    console.log("Validation errors:", newErrors);
    console.log("Validation result:", Object.keys(newErrors).length === 0);

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Clicked before validate");
    if (!validateForm()) {
      return;
    }
    console.log("Clicked after validate");
    try {
      const payrollData: CreatePayrollHeader = {
        start_date: formData.start_date!,
        end_date: formData.end_date!,
        run_date: format(new Date(), "yyyy-MM-dd"),
        employee_ids: [], // Let backend determine employees from timesheet_id
        run_by: "current_user", // Replace with actual user
        payroll_title: `Payroll for ${format(
          new Date(formData.start_date!),
          "MMM dd"
        )} - ${format(new Date(formData.end_date!), "MMM dd, yyyy")}`,
        notes: formData.notes || "",
        timesheet_id: formData.timesheet_id || undefined,
      };

      console.log("Submitting payroll data:", payrollData);
      await onGenerate(payrollData);
      onOpenChange(false);

      // Reset form
      setFormData({
        generation_type: "all_employees" as
          | "all_employees"
          | "selected_employees"
          | "by_department",
        timesheet_id: null,
        start_date: "",
        end_date: "",
        employee_ids: [] as string[],
        department_ids: [] as number[],
        notes: "",
      });
      setErrors({});
    } catch (error) {
      console.error("Failed to generate payroll:", error);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>Generate Payroll</DialogTitle>
            <DialogDescription>
              Create payroll for employees based on timesheet data
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Timesheet Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Timesheet Selection</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Select a timesheet to generate payroll. The employees and date
                  range will be automatically determined from the timesheet.
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Select Timesheet to Generate Payroll</Label>
                  <div className="flex gap-2">
                    <Select
                      value={formData.timesheet_id?.toString() || ""}
                      onValueChange={(value) =>
                        setFormData((prev) => ({
                          ...prev,
                          timesheet_id: parseInt(value),
                        }))
                      }
                    >
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Select a timesheet" />
                      </SelectTrigger>
                      <SelectContent>
                        {unconsumedTimesheets.map(
                          (timesheet: TimesheetResponse) => (
                            <SelectItem
                              key={timesheet.timesheet_id}
                              value={timesheet.timesheet_id.toString()}
                            >
                              {format(new Date(timesheet.start_date), "MMM dd")}{" "}
                              -{" "}
                              {format(
                                new Date(timesheet.end_date),
                                "MMM dd, yyyy"
                              )}
                              {timesheet.is_consumed && " (Consumed)"}
                            </SelectItem>
                          )
                        )}
                      </SelectContent>
                    </Select>
                    {formData.timesheet_id && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const timesheet = unconsumedTimesheets.find((t) => {
                            // Convert both to numbers for comparison since API returns string but formData has number
                            return (
                              Number(t.timesheet_id) ===
                              Number(formData.timesheet_id)
                            );
                          });

                          if (timesheet) {
                            setSelectedViewTimesheet(timesheet);
                            setViewTimesheetModalOpen(true);
                          }
                        }}
                      >
                        <Eye className="h-4 w-4" />
                        View
                      </Button>
                    )}
                  </div>
                  {errors.timesheet_id && (
                    <p className="text-sm text-red-500">
                      {errors.timesheet_id}
                    </p>
                  )}
                </div>

                {/* Date Display */}
                {formData.start_date && formData.end_date && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Start Date</Label>
                      <div className="p-3 bg-muted rounded-md">
                        {format(new Date(formData.start_date), "PPP")}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>End Date</Label>
                      <div className="p-3 bg-muted rounded-md">
                        {format(new Date(formData.end_date), "PPP")}
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {loading ? "Generating..." : "Generate Payroll"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Timesheet View Modal */}
      <TimesheetViewModal
        open={viewTimesheetModalOpen}
        onOpenChange={setViewTimesheetModalOpen}
        timesheet={selectedViewTimesheet}
      />
    </>
  );
}
