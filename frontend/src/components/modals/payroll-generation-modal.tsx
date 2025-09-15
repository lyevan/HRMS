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
import { Calendar } from "@/components/ui/calendar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon, Loader2, Users } from "lucide-react";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useEmployeeStore } from "@/store/employeeStore";
import { useDepartmentStore } from "@/store/departmentStore";
import type { CreatePayrollHeader } from "@/models/payroll-model";

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
    date_range_type: "custom" as
      | "current_cutoff"
      | "previous_cutoff"
      | "this_month"
      | "custom",
    start_date: "",
    end_date: "",
    employee_ids: [] as string[],
    department_ids: [] as number[],
    notes: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Use real stores instead of hardcoded data
  const { employees, fetchEmployees } = useEmployeeStore();

  const { departments, fetchDepartments } = useDepartmentStore(); // Fetch real data when modal opens
  useEffect(() => {
    if (open) {
      fetchEmployees();
      fetchDepartments();
    }
  }, [open, fetchEmployees, fetchDepartments]);

  // Auto-set dates based on range type
  useEffect(() => {
    const now = new Date();
    let startDate = "";
    let endDate = "";

    switch (formData.date_range_type) {
      case "current_cutoff":
        // Assuming 1st-15th and 16th-end of month cutoffs
        const currentDay = now.getDate();
        if (currentDay <= 15) {
          startDate = format(
            new Date(now.getFullYear(), now.getMonth(), 1),
            "yyyy-MM-dd"
          );
          endDate = format(
            new Date(now.getFullYear(), now.getMonth(), 15),
            "yyyy-MM-dd"
          );
        } else {
          startDate = format(
            new Date(now.getFullYear(), now.getMonth(), 16),
            "yyyy-MM-dd"
          );
          endDate = format(endOfMonth(now), "yyyy-MM-dd");
        }
        break;
      case "previous_cutoff":
        if (now.getDate() <= 15) {
          // Previous month's 16th-end
          const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 16);
          startDate = format(prevMonth, "yyyy-MM-dd");
          endDate = format(endOfMonth(prevMonth), "yyyy-MM-dd");
        } else {
          // Current month's 1st-15th
          startDate = format(
            new Date(now.getFullYear(), now.getMonth(), 1),
            "yyyy-MM-dd"
          );
          endDate = format(
            new Date(now.getFullYear(), now.getMonth(), 15),
            "yyyy-MM-dd"
          );
        }
        break;
      case "this_month":
        startDate = format(startOfMonth(now), "yyyy-MM-dd");
        endDate = format(endOfMonth(now), "yyyy-MM-dd");
        break;
      case "custom":
        // Keep existing dates or set to empty for manual selection
        return;
    }

    setFormData((prev) => ({
      ...prev,
      start_date: startDate,
      end_date: endDate,
    }));
  }, [formData.date_range_type]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.start_date) {
      newErrors.start_date = "Start date is required";
    }
    if (!formData.end_date) {
      newErrors.end_date = "End date is required";
    }

    if (formData.start_date && formData.end_date) {
      const startDate = new Date(formData.start_date);
      const endDate = new Date(formData.end_date);

      if (startDate >= endDate) {
        newErrors.end_date = "End date must be after start date";
      }
    }

    if (
      formData.generation_type === "selected_employees" &&
      formData.employee_ids?.length === 0
    ) {
      newErrors.employees = "Please select at least one employee";
    }

    if (
      formData.generation_type === "by_department" &&
      formData.department_ids?.length === 0
    ) {
      newErrors.departments = "Please select at least one department";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      const payrollData: CreatePayrollHeader = {
        start_date: formData.start_date!,
        end_date: formData.end_date!,
        run_date: format(new Date(), "yyyy-MM-dd"),
        employee_ids:
          formData.generation_type === "selected_employees"
            ? formData.employee_ids
            : [], // Send empty array for "all employees" to trigger backend logic
        run_by: "current_user", // Replace with actual user
        payroll_title: `Payroll for ${format(
          new Date(formData.start_date!),
          "MMM dd"
        )} - ${format(new Date(formData.end_date!), "MMM dd, yyyy")}`,
        notes: formData.notes || "",
      };

      await onGenerate(payrollData);
      onOpenChange(false);

      // Reset form
      setFormData({
        generation_type: "all_employees" as
          | "all_employees"
          | "selected_employees"
          | "by_department",
        date_range_type: "custom" as
          | "current_cutoff"
          | "previous_cutoff"
          | "this_month"
          | "custom",
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

  const handleDateSelect = (
    field: "start_date" | "end_date",
    date: Date | undefined
  ) => {
    if (date) {
      setFormData((prev) => ({
        ...prev,
        [field]: format(date, "yyyy-MM-dd"),
      }));

      if (errors[field]) {
        setErrors((prev) => ({
          ...prev,
          [field]: "",
        }));
      }
    }
  };

  const handleEmployeeSelect = (employeeId: string, checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      employee_ids: checked
        ? [...(prev.employee_ids || []), employeeId]
        : (prev.employee_ids || []).filter((id) => id !== employeeId),
    }));
  };

  const handleDepartmentSelect = (departmentId: number, checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      department_ids: checked
        ? [...(prev.department_ids || []), departmentId]
        : (prev.department_ids || []).filter((id) => id !== departmentId),
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Generate Payroll
          </DialogTitle>
          <DialogDescription>
            Create a new payroll run for the specified period and employees.
            Configure the generation options below.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Generation Type Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Generation Type</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Select
                value={formData.generation_type}
                onValueChange={(value: any) =>
                  setFormData((prev) => ({ ...prev, generation_type: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select generation type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all_employees">All Employees</SelectItem>
                  <SelectItem value="selected_employees">
                    Selected Employees
                  </SelectItem>
                  <SelectItem value="by_department">By Department</SelectItem>
                </SelectContent>
              </Select>

              {/* Employee Selection */}
              {formData.generation_type === "selected_employees" && (
                <div className="space-y-3">
                  <Label>Select Employees</Label>
                  <div className="max-h-40 overflow-y-auto border rounded-lg p-3 space-y-2">
                    {employees.map((emp) => (
                      <div
                        key={emp.employee_id}
                        className="flex items-center space-x-2"
                      >
                        <Checkbox
                          checked={formData.employee_ids?.includes(
                            emp.employee_id
                          )}
                          onCheckedChange={(checked) =>
                            handleEmployeeSelect(emp.employee_id, !!checked)
                          }
                        />
                        <div className="flex-1">
                          <p className="text-sm font-medium">
                            {emp.first_name} {emp.last_name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {emp.employee_id} - {emp.department}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                  {errors.employees && (
                    <p className="text-sm text-red-500">{errors.employees}</p>
                  )}
                </div>
              )}

              {/* Department Selection */}
              {formData.generation_type === "by_department" && (
                <div className="space-y-3">
                  <Label>Select Departments</Label>
                  <div className="space-y-2">
                    {departments.map((dept) => (
                      <div
                        key={dept.department_id}
                        className="flex items-center space-x-2"
                      >
                        <Checkbox
                          checked={formData.department_ids?.includes(
                            dept.department_id
                          )}
                          onCheckedChange={(checked) =>
                            handleDepartmentSelect(
                              dept.department_id,
                              !!checked
                            )
                          }
                        />
                        <Label className="text-sm font-medium">
                          {dept.name}
                        </Label>
                      </div>
                    ))}
                  </div>
                  {errors.departments && (
                    <p className="text-sm text-red-500">{errors.departments}</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Date Range Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Pay Period</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Date Range Type</Label>
                <Select
                  value={formData.date_range_type}
                  onValueChange={(value: any) =>
                    setFormData((prev) => ({ ...prev, date_range_type: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select date range" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="current_cutoff">
                      Current Cutoff
                    </SelectItem>
                    <SelectItem value="previous_cutoff">
                      Previous Cutoff
                    </SelectItem>
                    <SelectItem value="this_month">This Month</SelectItem>
                    <SelectItem value="custom">Custom Range</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Date Pickers */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Start Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !formData.start_date && "text-muted-foreground",
                          errors.start_date && "border-red-500"
                        )}
                        disabled={formData.date_range_type !== "custom"}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.start_date ? (
                          format(new Date(formData.start_date), "PPP")
                        ) : (
                          <span>Pick start date</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={
                          formData.start_date
                            ? new Date(formData.start_date)
                            : undefined
                        }
                        onSelect={(date) =>
                          handleDateSelect("start_date", date)
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  {errors.start_date && (
                    <p className="text-sm text-red-500">{errors.start_date}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>End Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !formData.end_date && "text-muted-foreground",
                          errors.end_date && "border-red-500"
                        )}
                        disabled={formData.date_range_type !== "custom"}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.end_date ? (
                          format(new Date(formData.end_date), "PPP")
                        ) : (
                          <span>Pick end date</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={
                          formData.end_date
                            ? new Date(formData.end_date)
                            : undefined
                        }
                        onSelect={(date) => handleDateSelect("end_date", date)}
                        disabled={(date) =>
                          formData.start_date
                            ? date <= new Date(formData.start_date)
                            : false
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  {errors.end_date && (
                    <p className="text-sm text-red-500">{errors.end_date}</p>
                  )}
                </div>
              </div>
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
  );
}
