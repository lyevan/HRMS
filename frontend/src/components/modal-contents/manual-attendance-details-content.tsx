import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Calendar,
  Clock,
  User,
  FileText,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import type { AttendanceRecord } from "@/models/attendance-model";

interface ManualAttendanceDetailsContentProps {
  attendanceRecord: AttendanceRecord | null;
  isReadOnly?: boolean;
  onSuccess: () => void;
  onClose: () => void;
}

const ManualAttendanceDetailsContent = ({
  attendanceRecord,
  isReadOnly = false,
  onSuccess,
  onClose,
}: ManualAttendanceDetailsContentProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState(attendanceRecord?.status || "");
  const [notes, setNotes] = useState(attendanceRecord?.notes || "");

  if (!attendanceRecord) {
    return (
      <div className="flex items-center justify-center h-32">
        <p className="text-muted-foreground">No attendance record selected</p>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case "present":
        return (
          <Badge variant="outline" className="text-green-600 border-green-600">
            <CheckCircle className="h-3 w-3 mr-1" />
            Present
          </Badge>
        );
      case "late":
        return (
          <Badge variant="outline" className="text-amber-600 border-amber-600">
            <Clock className="h-3 w-3 mr-1" />
            Late
          </Badge>
        );
      case "absent":
        return (
          <Badge variant="outline" className="text-red-600 border-red-600">
            <XCircle className="h-3 w-3 mr-1" />
            Absent
          </Badge>
        );
      case "half_day":
        return (
          <Badge
            variant="outline"
            className="text-orange-600 border-orange-600"
          >
            <Clock className="h-3 w-3 mr-1" />
            Half Day
          </Badge>
        );
      case "on_leave":
        return (
          <Badge variant="outline" className="text-blue-600 border-blue-600">
            <Calendar className="h-3 w-3 mr-1" />
            On Leave
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatTime = (timeString: string | null) => {
    if (!timeString) return "Not recorded";
    try {
      return format(new Date(timeString), "hh:mm a");
    } catch {
      return timeString;
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "MMMM dd, yyyy");
    } catch {
      return dateString;
    }
  };

  const calculateHoursWorked = () => {
    if (!attendanceRecord.time_in || !attendanceRecord.time_out) return null;

    try {
      const timeIn = new Date(attendanceRecord.time_in);
      const timeOut = new Date(attendanceRecord.time_out);
      const diffMs = timeOut.getTime() - timeIn.getTime();
      const diffHours = diffMs / (1000 * 60 * 60);
      return diffHours.toFixed(2);
    } catch {
      return null;
    }
  };

  const handleReject = async () => {
    setIsSubmitting(true);
    try {
      // Here you would call an API to reject the manual attendance
      // For now, we'll just show success
      toast.success("Manual attendance record rejected");
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error("Error rejecting attendance:", error);
      toast.error("Failed to reject attendance record");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdate = async () => {
    setIsSubmitting(true);
    try {
      // Here you would call an API to update the manual attendance
      // For now, we'll just show success
      toast.success("Manual attendance record updated");
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error("Error updating attendance:", error);
      toast.error("Failed to update attendance record");
    } finally {
      setIsSubmitting(false);
    }
  };

  const hoursWorked = calculateHoursWorked();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-2">
        <FileText className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-semibold">
          {isReadOnly
            ? "Manual Attendance Details"
            : "Review Manual Attendance"}
        </h3>
      </div>

      {/* Employee Information */}
      <div className="bg-muted/50 rounded-lg p-4 space-y-3">
        <div className="flex items-center space-x-2">
          <User className="h-4 w-4 text-muted-foreground" />
          <Label className="text-sm font-medium">Employee</Label>
        </div>
        <div>
          <p className="font-medium">
            {attendanceRecord.first_name} {attendanceRecord.last_name}
          </p>
          <p className="text-sm text-muted-foreground">
            ID: {attendanceRecord.employee_id}
          </p>
        </div>
      </div>

      {/* Attendance Details */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <Label className="text-sm font-medium">Date</Label>
          </div>
          <p className="text-sm">{formatDate(attendanceRecord.date)}</p>
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-medium">Status</Label>
          {isReadOnly ? (
            getStatusBadge(attendanceRecord.status || "")
          ) : (
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PRESENT">Present</SelectItem>
                <SelectItem value="LATE">Late</SelectItem>
                <SelectItem value="HALF_DAY">Half Day</SelectItem>
                <SelectItem value="ABSENT">Absent</SelectItem>
                <SelectItem value="ON_LEAVE">On Leave</SelectItem>
              </SelectContent>
            </Select>
          )}
        </div>
      </div>

      {/* Time Details */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <Label className="text-sm font-medium">Time In</Label>
          </div>
          <p className="text-sm">{formatTime(attendanceRecord.time_in)}</p>
        </div>

        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <Label className="text-sm font-medium">Time Out</Label>
          </div>
          <p className="text-sm">{formatTime(attendanceRecord.time_out)}</p>
        </div>
      </div>

      {/* Hours Worked */}
      {hoursWorked && (
        <div className="bg-muted/50 rounded-lg p-4">
          <Label className="text-sm font-medium">Hours Worked</Label>
          <p className="text-lg font-semibold">{hoursWorked} hours</p>
          {parseFloat(hoursWorked) > 8 && (
            <p className="text-sm text-muted-foreground">
              Overtime: {(parseFloat(hoursWorked) - 8).toFixed(2)} hours
            </p>
          )}
        </div>
      )}

      {/* Notes */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Notes</Label>
        {isReadOnly ? (
          <div className="p-3 bg-muted/50 rounded-lg">
            <p className="text-sm">
              {attendanceRecord.notes || "No notes provided"}
            </p>
          </div>
        ) : (
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add notes or comments..."
            rows={3}
          />
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end space-x-3 pt-4">
        <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
          {isReadOnly ? "Close" : "Cancel"}
        </Button>

        {!isReadOnly && (
          <>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={isSubmitting}
            >
              <XCircle className="h-4 w-4 mr-2" />
              Reject
            </Button>
            <Button onClick={handleUpdate} disabled={isSubmitting}>
              <CheckCircle className="h-4 w-4 mr-2" />
              {isSubmitting ? "Updating..." : "Update"}
            </Button>
          </>
        )}
      </div>
    </div>
  );
};

export default ManualAttendanceDetailsContent;
