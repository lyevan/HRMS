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
import { Calendar, CalendarCheck, FileText, User } from "lucide-react";
import { toast } from "sonner";
import type { FileLeaveFormData } from "@/models/leave-model";
import { useLeaveStore } from "@/store/leaveStore";
import { useEmployeeStore } from "@/store/employeeStore";

interface FileLeaveContentProps {
  onClose: () => void;
  onSuccess: () => void;
  currentEmployeeId?: string; // For employee self-filing
  isAdminFiling?: boolean; // Admin can file for any employee
}

const FileLeaveContent = ({
  onClose,
  onSuccess,
  currentEmployeeId,
  isAdminFiling = false,
}: FileLeaveContentProps) => {
  // Store hooks
  const {
    leaveTypes,
    submittingRequest,
    error: leaveError,
    fetchLeaveTypes,
    fileLeaveRequest,
    clearError,
  } = useLeaveStore();

  const {
    employees,
    loading: employeesLoading,
    fetchEmployees,
  } = useEmployeeStore();

  const methods = useForm<FileLeaveFormData>({
    defaultValues: {
      employee_id: currentEmployeeId || "",
      leave_type_id: 0,
      start_date: "",
      end_date: "",
      reason: "",
    },
  });

  const {
    handleSubmit,
    watch,
    setValue,
    register,
    formState: { errors },
  } = methods;

  // Calculate days requested
  const startDate = watch("start_date");
  const endDate = watch("end_date");
  const selectedEmployeeId = watch("employee_id");

  const daysRequested =
    startDate && endDate
      ? Math.max(
          0,
          Math.ceil(
            (new Date(endDate).getTime() - new Date(startDate).getTime()) /
              (1000 * 60 * 60 * 24)
          ) + 1
        )
      : 0;

  useEffect(() => {
    fetchLeaveTypes();
    if (isAdminFiling) {
      fetchEmployees();
    }

    // Clear any previous errors
    clearError();
  }, [isAdminFiling, fetchLeaveTypes, fetchEmployees, clearError]);

  // Prepare employee options for combobox
  const employeeOptions = employees.map((employee) => ({
    value: employee.employee_id,
    label: `${employee.first_name} ${employee.last_name}`,
    subtitle: `${employee.employee_id} - ${employee.position_title} - ${employee.department_name}`,
  }));

  const onSubmit = async (data: FileLeaveFormData) => {
    try {
      await fileLeaveRequest(data);
      toast.success("Leave request filed successfully");
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error("Error filing leave request:", error);
      toast.error(
        error.response?.data?.message ||
          leaveError ||
          "Failed to file leave request"
      );
    }
  };

  return (
    <FormProvider {...methods}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center space-x-2">
          <FileText className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">File Leave Request</h3>
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

          {/* Leave Type Selection */}
          <div className="space-y-2">
            <Label htmlFor="leave_type_id">Leave Type *</Label>
            <Select
              value={watch("leave_type_id")?.toString()}
              onValueChange={(value) =>
                setValue("leave_type_id", parseInt(value))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select leave type" />
              </SelectTrigger>
              <SelectContent>
                {leaveTypes.map((leaveType) => (
                  <SelectItem
                    key={leaveType.leave_type_id}
                    value={leaveType.leave_type_id.toString()}
                  >
                    <div>
                      <div className="font-medium">{leaveType.name}</div>
                      {leaveType.description && (
                        <div className="text-sm text-muted-foreground">
                          {leaveType.description}
                        </div>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.leave_type_id && (
              <p className="text-sm text-red-500">Leave type is required</p>
            )}
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label
                htmlFor="start_date"
                className="flex items-center space-x-2"
              >
                <Calendar className="h-4 w-4" />
                <span>Start Date *</span>
              </Label>
              <Input
                id="start_date"
                type="date"
                {...register("start_date", {
                  required: "Start date is required",
                })}
                min={new Date().toISOString().split("T")[0]}
              />
              {errors.start_date && (
                <p className="text-sm text-red-500">
                  {errors.start_date.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="end_date" className="flex items-center space-x-2">
                <CalendarCheck className="h-4 w-4" />
                <span>End Date *</span>
              </Label>
              <Input
                id="end_date"
                type="date"
                {...register("end_date", { required: "End date is required" })}
                min={startDate || new Date().toISOString().split("T")[0]}
              />
              {errors.end_date && (
                <p className="text-sm text-red-500">
                  {errors.end_date.message}
                </p>
              )}
            </div>
          </div>

          {/* Days Calculation */}
          {daysRequested > 0 && (
            <div className="rounded-md bg-muted p-3">
              <p className="text-sm font-medium">
                Days Requested:{" "}
                <span className="text-primary">{daysRequested}</span>
              </p>
            </div>
          )}

          {/* Reason */}
          <div className="space-y-2">
            <Label htmlFor="reason">Reason</Label>
            <Textarea
              id="reason"
              placeholder="Enter reason for leave (optional)"
              {...register("reason")}
              rows={3}
            />
          </div>

          {/* Error Display */}
          {leaveError && (
            <div className="rounded-md bg-red-50 border border-red-200 p-3">
              <p className="text-sm text-red-600">{leaveError}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={submittingRequest || daysRequested === 0}
            >
              {submittingRequest ? "Filing..." : "File Leave Request"}
            </Button>
          </div>
        </form>
      </div>
    </FormProvider>
  );
};

export default FileLeaveContent;
