import { useEffect } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Combobox } from "@/components/ui/combobox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar, Clock, FileText, User } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import type { ManualAttendanceRequest } from "@/models/attendance-model";
import { createManualAttendance } from "@/models/attendance-model";
import {
  createManualLogRequest,
  type CreateManualLogRequest,
} from "@/models/request-model";
import { useEmployeeStore } from "@/store/employeeStore";
import { useUserSessionStore } from "@/store/userSessionStore";

interface FileManualAttendanceContentProps {
  onClose: () => void;
  onSuccess: () => void;
  currentEmployeeId?: string; // For employee self-filing
  isAdminFiling?: boolean; // Admin can file for any employee
}

interface ManualAttendanceFormData {
  employee_id: string | undefined;
  date: string;
  time_in: string;
  time_out: string;
  break_duration: number; // Changed to number (minutes)
  shift_start_time: string;
  shift_end_time: string;
  status: "PRESENT" | "ABSENT" | "LATE" | "HALF_DAY" | "ON_LEAVE";
  notes: string;
}
const FileManualAttendanceContent = ({
  onClose,
  onSuccess,
  currentEmployeeId,
  isAdminFiling = false,
}: FileManualAttendanceContentProps) => {
  // Store hooks
  const {
    employees,
    loading: employeesLoading,
    fetchEmployees,
  } = useEmployeeStore();

  const { employee } = useUserSessionStore();

  const methods = useForm<ManualAttendanceFormData>({
    defaultValues: {
      employee_id: currentEmployeeId || "",
      date: format(new Date(), "yyyy-MM-dd"),
      time_in: "",
      time_out: "",
      break_duration: 60, // Default 60 minutes break
      shift_start_time: "08:00", // Default 8 AM start
      shift_end_time: "17:00", // Default 5 PM end
      status: "PRESENT",
      notes: "",
    },
  });

  const {
    handleSubmit,
    watch,
    setValue,
    register,
    formState: { errors, isSubmitting },
  } = methods;

  const selectedEmployeeId = watch("employee_id");
  const timeIn = watch("time_in");
  const timeOut = watch("time_out");
  const shiftStartTime = watch("shift_start_time");
  const shiftEndTime = watch("shift_end_time");

  // Calculate hours worked if both times are provided
  const hoursWorked =
    timeIn && timeOut
      ? (() => {
          const timeInDate = new Date(`2000-01-01T${timeIn}`);
          let timeOutDate = new Date(`2000-01-01T${timeOut}`);

          // Handle next day time_out (for night shifts)
          if (timeOutDate < timeInDate) {
            timeOutDate.setDate(timeOutDate.getDate() + 1);
          }

          const diffMs =
            timeOutDate.getTime() -
            timeInDate.getTime() -
            (watch("break_duration") || 0) * 60000; // Subtract break duration in ms
          const diffHours = diffMs / (1000 * 60 * 60);
          return diffHours.toFixed(2);
        })()
      : null;

  // Calculate total shift hours
  const totalShiftHours =
    shiftStartTime && shiftEndTime
      ? (() => {
          const shiftStartDate = new Date(`2000-01-01T${shiftStartTime}`);
          let shiftEndDate = new Date(`2000-01-01T${shiftEndTime}`);

          // Handle next day shift_end (for night shifts)
          if (shiftEndDate < shiftStartDate) {
            shiftEndDate.setDate(shiftEndDate.getDate() + 1);
          }

          const shiftDiffMs =
            shiftEndDate.getTime() -
            shiftStartDate.getTime() -
            (watch("break_duration") || 0) * 60000; // Subtract break duration in ms
          const shiftDiffHours = shiftDiffMs / (1000 * 60 * 60);
          return shiftDiffHours.toFixed(2);
        })()
      : null;

  // Calculate overtime hours
  const overtimeHours =
    hoursWorked &&
    totalShiftHours &&
    parseFloat(hoursWorked) > parseFloat(totalShiftHours)
      ? (parseFloat(hoursWorked) - parseFloat(totalShiftHours)).toFixed(2)
      : null;

  useEffect(() => {
    if (isAdminFiling) {
      fetchEmployees();
    }
  }, [isAdminFiling, fetchEmployees]);

  // Prepare employee options for combobox
  const employeeOptions = employees.map((employee) => ({
    value: employee.employee_id,
    label: `${employee.first_name} ${employee.last_name}`,
    subtitle: `${employee.employee_id} - ${employee.position_title} - ${employee.department_name}`,
  }));

  const onSubmit = async (data: ManualAttendanceFormData) => {
    try {
      const employeeId = isAdminFiling
        ? data.employee_id || ""
        : employee?.employee_id || "";

      if (isAdminFiling) {
        // Admin directly creates attendance record
        const requestData: ManualAttendanceRequest = {
          employee_id: employeeId,
          date: data.date,
          time_in: data.time_in || undefined,
          time_out: data.time_out || undefined,
          status: data.status,
          notes: data.notes || undefined,
        };

        await createManualAttendance(requestData);
        toast.success("Manual attendance record created successfully");
      } else {
        // Employee creates a request for approval
        const requestData: CreateManualLogRequest = {
          employee_id: employeeId,
          title: `Manual Log Request - ${data.date}`,
          description: data.notes || `Manual log request for ${data.date}`,
          target_date: data.date,
          time_in: data.time_in || undefined,
          time_out: data.time_out || undefined,
          break_duration: data.break_duration
            ? data.break_duration.toString()
            : undefined,
          shift_start_time: data.shift_start_time || undefined,
          shift_end_time: data.shift_end_time || undefined,
          reason: data.notes || "Manual attendance correction",
        };

        await createManualLogRequest(requestData);
        toast.success("Manual log request submitted successfully");
      }

      onSuccess();
      onClose();
    } catch (error: any) {
      console.error("Error:", error);
      const action = isAdminFiling
        ? "creating manual attendance"
        : "submitting manual log request";
      toast.error(error.message || `Failed to ${action}`);
    }
  };

  return (
    <FormProvider {...methods}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center space-x-2">
          <FileText className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">
            {isAdminFiling
              ? "Create Manual Attendance Record"
              : "Submit Manual Log Request"}
          </h3>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Employee Selection (Admin only) */}
          {isAdminFiling && (
            <div className="space-y-2">
              <Label
                htmlFor="employee_id"
                className="flex items-center space-x-2"
              >
                <User className="h-4 w-4" />
                <span>Employee *</span>
              </Label>
              <Combobox
                options={employeeOptions}
                value={selectedEmployeeId}
                onValueChange={(value) => setValue("employee_id", value)}
                placeholder="Select an employee..."
                searchPlaceholder="Search employees..."
                disabled={employeesLoading}
              />
              {errors.employee_id && (
                <p className="text-sm text-red-500">Employee is required</p>
              )}
            </div>
          )}

          {/* Date and Status */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date" className="flex items-center space-x-2">
                <Calendar className="h-4 w-4" />
                <span>Date *</span>
              </Label>
              <Input
                id="date"
                type="date"
                {...register("date", {
                  required: "Date is required",
                })}
              />
              {errors.date && (
                <p className="text-sm text-red-500">{errors.date.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status *</Label>
              <Select
                value={watch("status")}
                onValueChange={(value) => setValue("status", value as any)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PRESENT">Present</SelectItem>
                  <SelectItem value="LATE">Late</SelectItem>
                  <SelectItem value="HALF_DAY">Half Day</SelectItem>
                  <SelectItem value="ABSENT">Absent</SelectItem>
                  <SelectItem value="ON_LEAVE">On Leave</SelectItem>
                </SelectContent>
              </Select>
              {errors.status && (
                <p className="text-sm text-red-500">Status is required</p>
              )}
            </div>
          </div>

          {/* Time In and Time Out */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="time_in" className="flex items-center space-x-2">
                <Clock className="h-4 w-4" />
                <span>Time In</span>
              </Label>
              <Input id="time_in" type="time" {...register("time_in")} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="time_out" className="flex items-center space-x-2">
                <Clock className="h-4 w-4" />
                <span>Time Out</span>
              </Label>
              <Input id="time_out" type="time" {...register("time_out")} />
            </div>
          </div>

          {/* Shift Times and Break Duration */}
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label
                htmlFor="shift_start_time"
                className="flex items-center space-x-2"
              >
                <Clock className="h-4 w-4" />
                <span>Shift Start</span>
              </Label>
              <Input
                id="shift_start_time"
                type="time"
                {...register("shift_start_time")}
              />
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="shift_end_time"
                className="flex items-center space-x-2"
              >
                <Clock className="h-4 w-4" />
                <span>Shift End</span>
              </Label>
              <Input
                id="shift_end_time"
                type="time"
                {...register("shift_end_time")}
              />
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="break_duration"
                className="flex items-center space-x-2"
              >
                <Clock className="h-4 w-4" />
                <span>Break Duration</span>
              </Label>
              <Input
                id="break_duration"
                type="number"
                min="0"
                max="480"
                step="15"
                placeholder="60"
                {...register("break_duration", { valueAsNumber: true })}
              />
              <p className="text-xs text-muted-foreground">
                Break duration in minutes (e.g., 60 for 1 hour)
              </p>
            </div>
          </div>

          {/* Hours Worked Display */}
          {hoursWorked && (
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">
                Calculated Hours Worked:{" "}
                <span className="font-medium text-foreground">
                  {hoursWorked} hours
                </span>
              </p>
            </div>
          )}

          {/* Overtime Hours Display */}
          {overtimeHours && (
            <div className="p-3 bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800 rounded-lg">
              <p className="text-sm text-orange-700 dark:text-orange-300">
                Overtime Hours:{" "}
                <span className="font-medium text-orange-900 dark:text-orange-100">
                  {overtimeHours} hours
                </span>
              </p>
              <p className="text-xs text-orange-600 dark:text-orange-400 mt-1">
                Total worked: {hoursWorked}h | Shift duration: {totalShiftHours}
                h
              </p>
            </div>
          )}

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              placeholder="Enter any additional notes or reasons..."
              {...register("notes")}
              rows={3}
            />
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting
                ? isAdminFiling
                  ? "Creating..."
                  : "Submitting..."
                : isAdminFiling
                ? "Create Record"
                : "Submit Request"}
            </Button>
          </div>
        </form>
      </div>
    </FormProvider>
  );
};

export default FileManualAttendanceContent;
