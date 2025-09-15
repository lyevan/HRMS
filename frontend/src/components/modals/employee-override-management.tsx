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
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Combobox } from "@/components/ui/combobox";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  CalendarIcon,
  Plus,
  Edit,
  Trash2,
  User,
  Clock,
  Calendar as CalendarDays,
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useEmployeeStore } from "@/store/employeeStore";
import type {
  EmployeeScheduleOverride,
  CreateEmployeeOverride,
} from "@/models/payroll-model";

interface EmployeeOverrideManagementProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employeeId?: string;
}

export function EmployeeOverrideManagement({
  open,
  onOpenChange,
  employeeId,
}: EmployeeOverrideManagementProps) {
  const [overrides, setOverrides] = useState<EmployeeScheduleOverride[]>([]);

  // Use real employee store instead of hardcoded data
  const { employees, fetchEmployees } = useEmployeeStore();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingOverride, setEditingOverride] =
    useState<EmployeeScheduleOverride | null>(null);
  const [selectedEmployee, setSelectedEmployee] = useState(employeeId || "all");

  // Form state for creating/editing overrides
  const [formData, setFormData] = useState<CreateEmployeeOverride>({
    employee_id: "",
    override_type: "hours_per_day",
    override_value: 8,
    effective_from: "",
    effective_until: "",
    reason: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Load real data when modal opens
  useEffect(() => {
    if (open) {
      // Fetch employees from store
      fetchEmployees();

      // Mock overrides data - TODO: Replace with real API call
      setOverrides([
        {
          override_id: 1,
          employee_id: "EMP001",
          override_type: "hours_per_day",
          override_value: 6,
          effective_from: "2025-01-01",
          effective_until: "2025-03-31",
          reason: "Part-time schedule for Q1",
          created_at: "2024-12-15T10:00:00",
          updated_at: "2024-12-15T10:00:00",
        },
        {
          override_id: 2,
          employee_id: "EMP002",
          override_type: "days_per_week",
          override_value: 4,
          effective_from: "2025-02-01",
          effective_until: "2025-02-28",
          reason: "Reduced schedule for medical reasons",
          created_at: "2024-12-10T14:30:00",
          updated_at: "2024-12-10T14:30:00",
        },
      ]);

      // Set initial employee if provided
      if (employeeId) {
        setSelectedEmployee(employeeId);
      }
    }
  }, [open, employeeId, fetchEmployees]);

  // Prepare employee options for combobox
  const employeeOptions = [
    {
      value: "all",
      label: "All Employees",
      subtitle: "View all employee overrides",
    },
    ...employees.map((employee) => ({
      value: employee.employee_id,
      label: `${employee.first_name} ${employee.last_name}`,
      subtitle: `${employee.employee_id} - ${employee.position_title} - ${employee.department_name}`,
    })),
  ];

  const getFilteredOverrides = () => {
    if (!selectedEmployee || selectedEmployee === "all") return overrides;
    return overrides.filter(
      (override) => override.employee_id === selectedEmployee
    );
  };

  const getEmployeeName = (employeeId: string) => {
    const employee = employees.find((emp) => emp.employee_id === employeeId);
    return employee
      ? `${employee.first_name} ${employee.last_name}`
      : employeeId;
  };

  const getOverrideTypeLabel = (type: string) => {
    switch (type) {
      case "hours_per_day":
        return "Daily Hours";
      case "days_per_week":
        return "Weekly Days";
      case "monthly_working_days":
        return "Monthly Days";
      default:
        return type;
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.employee_id) {
      newErrors.employee_id = "Employee is required";
    }
    if (!formData.override_value || formData.override_value <= 0) {
      newErrors.override_value = "Override value must be greater than 0";
    }
    if (!formData.effective_from) {
      newErrors.effective_from = "Start date is required";
    }
    if (formData.effective_from && formData.effective_until) {
      const startDate = new Date(formData.effective_from);
      const endDate = new Date(formData.effective_until);
      if (startDate >= endDate) {
        newErrors.effective_until = "End date must be after start date";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCreateOverride = () => {
    setFormData({
      employee_id:
        selectedEmployee && selectedEmployee !== "all" ? selectedEmployee : "",
      override_type: "hours_per_day",
      override_value: 8,
      effective_from: "",
      effective_until: "",
      reason: "",
    });
    setEditingOverride(null);
    setShowCreateModal(true);
  };

  const handleEditOverride = (override: EmployeeScheduleOverride) => {
    setFormData({
      employee_id: override.employee_id,
      override_type: override.override_type,
      override_value: override.override_value,
      effective_from: override.effective_from,
      effective_until: override.effective_until || "",
      reason: override.reason || "",
    });
    setEditingOverride(override);
    setShowCreateModal(true);
  };

  const handleDeleteOverride = (overrideId: number) => {
    if (confirm("Are you sure you want to delete this override?")) {
      setOverrides((prev) => prev.filter((o) => o.override_id !== overrideId));
    }
  };

  const handleSubmitOverride = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      if (editingOverride) {
        // Update existing override
        setOverrides((prev) =>
          prev.map((o) =>
            o.override_id === editingOverride.override_id
              ? { ...o, ...formData, updated_at: new Date().toISOString() }
              : o
          )
        );
      } else {
        // Create new override
        const newOverride: EmployeeScheduleOverride = {
          override_id: Date.now(), // Mock ID
          ...formData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        setOverrides((prev) => [...prev, newOverride]);
      }

      setShowCreateModal(false);
      setErrors({});
    } catch (error) {
      console.error("Failed to save override:", error);
    }
  };

  const handleDateSelect = (
    field: "effective_from" | "effective_until",
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

  const filteredOverrides = getFilteredOverrides();

  return (
    <>
      {/* Main Dialog */}
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Employee Schedule Overrides
            </DialogTitle>
            <DialogDescription>
              Manage individual employee schedule exceptions and overrides.
              These settings will take precedence over standard configurations.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Employee Filter */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Filter by Employee</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <Combobox
                    options={employeeOptions}
                    value={selectedEmployee}
                    onValueChange={setSelectedEmployee}
                    placeholder="All employees"
                    searchPlaceholder="Search employees..."
                    className="w-64"
                  />
                  <Button
                    onClick={handleCreateOverride}
                    className="flex items-center gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    New Override
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Overrides Table */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Active Overrides</CardTitle>
              </CardHeader>
              <CardContent>
                {filteredOverrides.length === 0 ? (
                  <div className="text-center py-8">
                    <CalendarDays className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">
                      {selectedEmployee && selectedEmployee !== "all"
                        ? "No overrides for selected employee"
                        : "No overrides configured"}
                    </p>
                    <Button
                      onClick={handleCreateOverride}
                      variant="outline"
                      className="mt-4"
                    >
                      Create First Override
                    </Button>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Employee</TableHead>
                        <TableHead>Override Type</TableHead>
                        <TableHead>Value</TableHead>
                        <TableHead>Effective Period</TableHead>
                        <TableHead>Reason</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredOverrides.map((override) => (
                        <TableRow key={override.override_id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">
                                {getEmployeeName(override.employee_id)}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {override.employee_id}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {getOverrideTypeLabel(override.override_type)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <span className="font-medium">
                              {override.override_value}
                            </span>
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="text-sm">
                                {format(
                                  new Date(override.effective_from),
                                  "PPP"
                                )}
                              </p>
                              {override.effective_until && (
                                <p className="text-sm text-muted-foreground">
                                  to{" "}
                                  {format(
                                    new Date(override.effective_until),
                                    "PPP"
                                  )}
                                </p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <p className="text-sm">
                              {override.reason || "No reason provided"}
                            </p>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEditOverride(override)}
                              >
                                <Edit className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  handleDeleteOverride(override.override_id!)
                                }
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create/Edit Override Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              {editingOverride ? "Edit Override" : "Create Override"}
            </DialogTitle>
            <DialogDescription>
              {editingOverride
                ? "Update the employee schedule override details."
                : "Create a new schedule override for an employee."}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmitOverride} className="space-y-4">
            {/* Employee Selection */}
            <div className="space-y-2">
              <Label>Employee</Label>
              <Combobox
                options={employees.map((emp) => ({
                  value: emp.employee_id,
                  label: `${emp.first_name} ${emp.last_name}`,
                  subtitle: `${emp.employee_id} - ${emp.position_title} - ${emp.department_name}`,
                }))}
                value={formData.employee_id}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, employee_id: value }))
                }
                placeholder="Select employee"
                searchPlaceholder="Search employees..."
                disabled={!!editingOverride}
                className={cn(errors.employee_id && "border-red-500")}
              />
              {errors.employee_id && (
                <p className="text-sm text-red-500">{errors.employee_id}</p>
              )}
            </div>

            {/* Override Type */}
            <div className="space-y-2">
              <Label>Override Type</Label>
              <Select
                value={formData.override_type}
                onValueChange={(value: any) =>
                  setFormData((prev) => ({ ...prev, override_type: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hours_per_day">Hours per Day</SelectItem>
                  <SelectItem value="days_per_week">Days per Week</SelectItem>
                  <SelectItem value="monthly_working_days">
                    Monthly Working Days
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Override Value */}
            <div className="space-y-2">
              <Label>Override Value</Label>
              <Input
                type="number"
                step="0.5"
                min="0"
                value={formData.override_value}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    override_value: parseFloat(e.target.value) || 0,
                  }))
                }
                className={cn(errors.override_value && "border-red-500")}
                placeholder="Enter override value"
              />
              {errors.override_value && (
                <p className="text-sm text-red-500">{errors.override_value}</p>
              )}
            </div>

            {/* Date Range */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Effective From</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !formData.effective_from && "text-muted-foreground",
                        errors.effective_from && "border-red-500"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.effective_from ? (
                        format(new Date(formData.effective_from), "PPP")
                      ) : (
                        <span>Pick start date</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={
                        formData.effective_from
                          ? new Date(formData.effective_from)
                          : undefined
                      }
                      onSelect={(date) =>
                        handleDateSelect("effective_from", date)
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                {errors.effective_from && (
                  <p className="text-sm text-red-500">
                    {errors.effective_from}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Effective Until (Optional)</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !formData.effective_until && "text-muted-foreground",
                        errors.effective_until && "border-red-500"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.effective_until ? (
                        format(new Date(formData.effective_until), "PPP")
                      ) : (
                        <span>Pick end date</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={
                        formData.effective_until
                          ? new Date(formData.effective_until)
                          : undefined
                      }
                      onSelect={(date) =>
                        handleDateSelect("effective_until", date)
                      }
                      disabled={(date) =>
                        formData.effective_from
                          ? date <= new Date(formData.effective_from)
                          : false
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                {errors.effective_until && (
                  <p className="text-sm text-red-500">
                    {errors.effective_until}
                  </p>
                )}
              </div>
            </div>

            {/* Reason */}
            <div className="space-y-2">
              <Label>Reason (Optional)</Label>
              <Textarea
                value={formData.reason}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, reason: e.target.value }))
                }
                placeholder="Explain why this override is needed..."
                rows={3}
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowCreateModal(false)}
              >
                Cancel
              </Button>
              <Button type="submit">
                {editingOverride ? "Update Override" : "Create Override"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
