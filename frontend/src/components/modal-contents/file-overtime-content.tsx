import { useEffect, useState } from "react";
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
import { Clock, Timer, FileText, User, Calendar } from "lucide-react";
import { toast } from "sonner";
import type { CreateOvertimeRequest } from "@/models/request-model";
import { createOvertimeRequest } from "@/models/request-model";
import { useEmployeeStore } from "@/store/employeeStore";
import { useAttendanceStore } from "@/store/attendanceStore";

interface FileOvertimeContentProps {
  onClose: () => void;
  onSuccess: () => void;
  currentEmployeeId?: string; // For employee self-filing
  isAdminFiling?: boolean; // Admin can file for any employee
}

const FileOvertimeContent = ({
  onClose,
  onSuccess,
  currentEmployeeId,
  isAdminFiling = false,
}: FileOvertimeContentProps) => {
  // Store hooks
  const {
    employees,
    loading: employeesLoading,
    fetchEmployees,
  } = useEmployeeStore();

  const {
    attendanceRecords,
    loading: attendanceLoading,
    fetchEmployeeAttendanceRecords,
  } = useAttendanceStore();

  // Local state
  const [submitting, setSubmitting] = useState(false);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>(
    currentEmployeeId || ""
  );

  const methods = useForm<CreateOvertimeRequest>({
    defaultValues: {
      employee_id: currentEmployeeId || "",
      title: "",
      description: "",
      reason: "",
      project_or_task: "",
      expected_hours: 1,
      attendance_id: 0,
    },
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
    reset,
  } = methods;

  // Watch for employee selection changes
  const watchedEmployeeId = watch("employee_id");

  useEffect(() => {
    if (isAdminFiling) {
      fetchEmployees();
    }
  }, [fetchEmployees, isAdminFiling]);

  useEffect(() => {
    if (watchedEmployeeId) {
      setSelectedEmployeeId(watchedEmployeeId);
      fetchAttendanceRecords(watchedEmployeeId);
    }
  }, [watchedEmployeeId, fetchEmployeeAttendanceRecords]);

  const fetchAttendanceRecords = async (employeeId: string) => {
    if (!employeeId) return;

    try {
      // Use the attendance store to fetch records for the employee
      await fetchEmployeeAttendanceRecords(employeeId);
    } catch (error) {
      console.error("Error fetching attendance records:", error);
      toast.error("Failed to fetch attendance records");
    }
  };

  const onSubmit = async (data: CreateOvertimeRequest) => {
    try {
      setSubmitting(true);

      // Find the selected attendance record to get the date
      const selectedAttendance = attendanceRecords.find(
        (record) =>
          record.attendance_id.toString() === data.attendance_id?.toString()
      );

      if (!selectedAttendance) {
        toast.error("Please select a valid attendance record");
        return;
      }

      const requestData: CreateOvertimeRequest = {
        ...data,
        description:
          data.description ||
          `Overtime request for ${data.expected_hours} hours on ${
            selectedAttendance.date.split("T")[0]
          }`,
        attendance_id: data.attendance_id!,
      };

      await createOvertimeRequest(requestData);

      toast.success("Overtime request submitted successfully!");
      reset();
      onSuccess();
      onClose();
    } catch (error) {
      console.error("Error submitting overtime request:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to submit overtime request"
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    reset();
    onClose();
  };

  // Prepare employee options for combobox
  const employeeOptions = employees.map((emp) => ({
    value: emp.employee_id,
    label: `${emp.first_name} ${emp.last_name} (${emp.employee_id})`,
  }));

  // Prepare attendance options - filter for records eligible for overtime
  // Only show records where employee actually worked and has time_in
  const eligibleAttendanceRecords = attendanceRecords.filter((record) => {
    // Only show records for the selected employee
    if (selectedEmployeeId && record.employee_id !== selectedEmployeeId) {
      return false;
    }

    // Must have time_in (actually showed up to work)
    if (!record.time_in) {
      return false;
    }

    // Must not be on leave
    // if (record.on_leave) {
    //   return false;
    // }

    // Must be present (not absent)
    if (record.is_absent) {
      return false;
    }

    // Only show recent records (last 7 days)
    const recordDate = new Date(record.date);
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    return recordDate >= sevenDaysAgo;
  });
  console.log("Eligible attendance records:", eligibleAttendanceRecords);
  const attendanceOptions = eligibleAttendanceRecords.map((record) => ({
    value: record.attendance_id.toString(),
    label: `${record.date.split("T")[0]} - ${
      record.time_in
        ? new Date(record.time_in).toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
          })
        : "N/A"
    }${
      record.time_out
        ? ` to ${new Date(record.time_out).toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
          })}`
        : " (ongoing)"
    } (${record.total_hours || 0}h worked)`,
  }));

  return (
    <FormProvider {...methods}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 w-full">
        {/* Header */}
        <div className="flex items-center space-x-3 border-b pb-4">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Timer className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">File Overtime Request</h3>
            <p className="text-sm text-muted-foreground">
              Request overtime hours for completed work
            </p>
          </div>
        </div>

        {/* Employee Selection (for admin) */}
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
              value={watch("employee_id")}
              onValueChange={(value) => setValue("employee_id", value)}
              placeholder="Select employee..."
              searchPlaceholder="Search employees..."
              disabled={employeesLoading}
            />
            {errors.employee_id && (
              <p className="text-sm text-red-500">
                {errors.employee_id.message}
              </p>
            )}
          </div>
        )}

        {/* Attendance Record Selection */}
        {selectedEmployeeId && (
          <div className="space-y-2 w-full">
            <Label
              htmlFor="attendance_id"
              className="flex items-center space-x-2"
            >
              <Calendar className="h-4 w-4" />
              <span>Work Day *</span>
            </Label>
            <Select
              value={
                watch("attendance_id")
                  ? watch("attendance_id").toString()
                  : undefined
              }
              onValueChange={(value) =>
                setValue("attendance_id", parseInt(value))
              }
              disabled={attendanceLoading}
            >
              <SelectTrigger className="w-full">
                <SelectValue
                  placeholder={
                    attendanceLoading
                      ? "Loading attendance records..."
                      : "Select work day..."
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {attendanceOptions.map((option) => (
                  <SelectItem
                    key={option.value}
                    value={option.value.toString()}
                  >
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {eligibleAttendanceRecords.length === 0 &&
              !attendanceLoading &&
              selectedEmployeeId && (
                <p className="text-sm text-yellow-600">
                  No eligible attendance records found for overtime requests
                </p>
              )}
            {errors.attendance_id && (
              <p className="text-sm text-red-500">Please select a work day</p>
            )}
          </div>
        )}

        {/* Request Title */}
        <div className="space-y-2">
          <Label htmlFor="title" className="flex items-center space-x-2">
            <FileText className="h-4 w-4" />
            <span>Request Title *</span>
          </Label>
          <Input
            id="title"
            placeholder="e.g., Overtime for project deadline"
            {...register("title", { required: "Title is required" })}
          />
          {errors.title && (
            <p className="text-sm text-red-500">{errors.title.message}</p>
          )}
        </div>

        {/* Expected Overtime Hours */}
        <div className="space-y-2">
          <Label
            htmlFor="expected_hours"
            className="flex items-center space-x-2"
          >
            <Clock className="h-4 w-4" />
            <span>Overtime Hours *</span>
          </Label>
          <Input
            id="expected_hours"
            type="number"
            step="0.5"
            min="0.5"
            max="12"
            placeholder="e.g., 2.5"
            {...register("expected_hours", {
              required: "Overtime hours is required",
              min: { value: 0.5, message: "Minimum 0.5 hours" },
              max: { value: 12, message: "Maximum 12 hours per day" },
              valueAsNumber: true,
            })}
          />
          {errors.expected_hours && (
            <p className="text-sm text-red-500">
              {errors.expected_hours.message}
            </p>
          )}
        </div>

        {/* End Time */}
        <div className="space-y-2">
          <Label htmlFor="end_time" className="flex items-center space-x-2">
            <Clock className="h-4 w-4" />
            <span>Expected End Time</span>
          </Label>
          <Input
            id="end_time"
            type="text"
            placeholder="18:30 or 6:30 PM"
            onFocus={(e) => (e.target.type = "time")}
            {...register("end_time", {
              onBlur: (e) => {
                if (!e.target.value) {
                  e.target.type = "text";
                }
              },
            })}
            value={watch("end_time")}
          />
          <p className="text-xs text-muted-foreground">
            When do you expect to finish the overtime work?
          </p>
        </div>

        {/* Project/Task */}
        <div className="space-y-2">
          <Label htmlFor="project_or_task">Project or Task</Label>
          <Input
            id="project_or_task"
            placeholder="e.g., Client presentation preparation"
            {...register("project_or_task")}
          />
        </div>

        {/* Reason */}
        <div className="space-y-2">
          <Label htmlFor="reason" className="flex items-center space-x-2">
            <FileText className="h-4 w-4" />
            <span>Reason for Overtime *</span>
          </Label>
          <Textarea
            id="reason"
            placeholder="Explain why overtime is necessary..."
            rows={3}
            {...register("reason", { required: "Reason is required" })}
          />
          {errors.reason && (
            <p className="text-sm text-red-500">{errors.reason.message}</p>
          )}
        </div>

        {/* Description */}
        <div className="space-y-2">
          <Label htmlFor="description" className="flex items-center space-x-2">
            <FileText className="h-4 w-4" />
            <span>Description *</span>
          </Label>
          <Textarea
            id="description"
            placeholder="Provide details about the overtime work..."
            rows={3}
            {...register("description", {
              required: "Description is required",
            })}
          />
          {errors.description && (
            <p className="text-sm text-red-500">{errors.description.message}</p>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-3 py-4 border-t bg-background sticky bottom-0">
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={submitting || !selectedEmployeeId || attendanceLoading}
            className="bg-primary hover:bg-primary/80"
          >
            {submitting ? (
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Submitting...</span>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Timer className="h-4 w-4" />
                <span>Submit Request</span>
              </div>
            )}
          </Button>
        </div>
      </form>
    </FormProvider>
  );
};

export default FileOvertimeContent;
