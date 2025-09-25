import { useForm, FormProvider } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar, Clock, FileText } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import {
  createManualLogRequest,
  type CreateManualLogRequest,
} from "@/models/request-model";
import { useUserSessionStore } from "@/store/userSessionStore";

interface FileManualAttendanceContentProps {
  onClose: () => void;
  onSuccess: () => void;
}

interface ManualAttendanceFormData {
  date: string;
  time_in: string;
  time_out: string;
  reason: string;
}

const FileManualAttendanceContent = ({
  onClose,
  onSuccess,
}: FileManualAttendanceContentProps) => {
  // Store hooks
  const { employee } = useUserSessionStore();

  const methods = useForm<ManualAttendanceFormData>({
    defaultValues: {
      date: format(new Date(), "yyyy-MM-dd"),
      time_in: "",
      time_out: "",
      reason: "",
    },
  });

  const {
    handleSubmit,
    register,
    formState: { errors, isSubmitting },
  } = methods;

  // Basic validation: ensure time difference is not more than 20 hours
  const validateTimeDifference = (timeIn: string, timeOut: string): boolean => {
    if (!timeIn || !timeOut) return true; // Let required validation handle this

    const timeInDate = new Date(`2000-01-01T${timeIn}`);
    let timeOutDate = new Date(`2000-01-01T${timeOut}`);

    // Handle next day time_out (for night shifts)
    if (timeOutDate < timeInDate) {
      timeOutDate.setDate(timeOutDate.getDate() + 1);
    }

    const diffMs = timeOutDate.getTime() - timeInDate.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);

    return diffHours <= 20; // Max 20 hours to prevent exploits
  };

  const onSubmit = async (data: ManualAttendanceFormData) => {
    try {
      // Validate time difference
      if (!validateTimeDifference(data.time_in, data.time_out)) {
        toast.error("Time difference cannot exceed 20 hours");
        return;
      }

      // Use session employee ID
      const employeeId = employee?.employee_id;
      if (!employeeId) {
        toast.error("Employee ID not found in session");
        return;
      }

      // Convert times to full UTC timestamps
      // Assume input times are in Manila time (UTC+8), convert to UTC
      const convertManilaTimeToUTC = (
        date: string,
        timeIn: string,
        timeOut: string
      ): { timeInUTC: string; timeOutUTC: string } => {
        let timeInDate = new Date(`${date}T${timeIn}+08:00`);
        let timeOutDate = new Date(`${date}T${timeOut}+08:00`);

        // If time_out is earlier than time_in, add +1 day
        if (timeOutDate <= timeInDate) {
          timeOutDate.setUTCDate(timeOutDate.getUTCDate() + 1);
        }

        return {
          timeInUTC: timeInDate.toISOString(),
          timeOutUTC: timeOutDate.toISOString(),
        };
      };

      const timeInUTC = convertManilaTimeToUTC(
        data.date,
        data.time_in,
        data.time_out
      ).timeInUTC;
      const timeOutUTC = convertManilaTimeToUTC(
        data.date,
        data.time_in,
        data.time_out
      ).timeOutUTC;

      // Create the request
      const requestData: CreateManualLogRequest = {
        employee_id: employeeId,
        title: `Manual Attendance Log - ${data.date}`,
        description: data.reason || `Manual attendance log for ${data.date}`,
        target_date: data.date,
        time_in: timeInUTC,
        time_out: timeOutUTC,
        reason: data.reason,
      };

      await createManualLogRequest(requestData);

      toast.success("Manual log request submitted successfully");
      onSuccess();
      onClose();
    } catch (error) {
      console.error("Error creating manual log request:", error);
      toast.error("Failed to submit manual log request");
    }
  };

  return (
    <FormProvider {...methods}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center space-x-2">
          <FileText className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">Submit Manual Log Request</h3>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Date */}
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

          {/* Time In and Time Out */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="time_in" className="flex items-center space-x-2">
                <Clock className="h-4 w-4" />
                <span>Time In *</span>
              </Label>
              <Input
                id="time_in"
                type="time"
                {...register("time_in", {
                  required: "Time In is required",
                })}
              />
              {errors.time_in && (
                <p className="text-sm text-red-500">{errors.time_in.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="time_out" className="flex items-center space-x-2">
                <Clock className="h-4 w-4" />
                <span>Time Out *</span>
              </Label>
              <Input
                id="time_out"
                type="time"
                {...register("time_out", {
                  required: "Time Out is required",
                })}
              />
              {errors.time_out && (
                <p className="text-sm text-red-500">
                  {errors.time_out.message}
                </p>
              )}
            </div>
          </div>

          {/* Reason */}
          <div className="space-y-2">
            <Label htmlFor="reason">Reason *</Label>
            <Textarea
              id="reason"
              placeholder="Please explain why you need to submit a manual log..."
              {...register("reason", {
                required: "Reason is required",
              })}
              rows={3}
            />
            {errors.reason && (
              <p className="text-sm text-red-500">{errors.reason.message}</p>
            )}
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
              {isSubmitting ? "Submitting..." : "Submit Request"}
            </Button>
          </div>
        </form>
      </div>
    </FormProvider>
  );
};

export default FileManualAttendanceContent;
