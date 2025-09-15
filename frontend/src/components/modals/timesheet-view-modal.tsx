import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, Users, Calendar, Clock } from "lucide-react";
import { format } from "date-fns";
import type { TimesheetResponse } from "@/models/attendance-model";
import { fetchAttendanceByTimesheet } from "@/models/attendance-model";
import { TimesheetAttendanceTable } from "@/components/tables/timesheet-attendance-table";
import {
  timesheetAttendanceColumns,
  type AttendanceWithEmployee,
} from "@/components/tables/columns/timesheet-attendance-columns";

interface TimesheetViewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  timesheet: TimesheetResponse | null;
}

export default function TimesheetViewModal({
  open,
  onOpenChange,
  timesheet,
}: TimesheetViewModalProps) {
  const [attendanceRecords, setAttendanceRecords] = useState<
    AttendanceWithEmployee[]
  >([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open && timesheet) {
      fetchTimesheetAttendance();
    }
  }, [open, timesheet]);

  const fetchTimesheetAttendance = async () => {
    if (!timesheet) return;

    setLoading(true);
    setError(null);

    try {
      const data = await fetchAttendanceByTimesheet(timesheet.timesheet_id);
      // Cast the attendance records to our interface since backend has flattened structure
      setAttendanceRecords(data.attendance as AttendanceWithEmployee[]);
    } catch (err) {
      console.error("Failed to fetch timesheet attendance:", err);
      setError("Failed to load attendance records");
    } finally {
      setLoading(false);
    }
  };

  const columns = timesheetAttendanceColumns() as any;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] sm:max-w-[90vw] overflow-auto flex flex-col resize">
        <DialogHeader>
          <DialogTitle>Timesheet Attendance Records</DialogTitle>
          <DialogDescription>
            View all attendance records for the selected timesheet period.
          </DialogDescription>
          {timesheet && (
            <div className="flex items-center gap-4 text-sm mt-2">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                {format(new Date(timesheet.start_date), "MMM dd")} -{" "}
                {format(new Date(timesheet.end_date), "MMM dd, yyyy")}
              </div>
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                {timesheet.employeeCount} employees
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                {timesheet.recordCount} records
              </div>
            </div>
          )}
        </DialogHeader>

        <div className="flex-1 overflow-auto">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin mr-2" />
              Loading attendance records...
            </div>
          ) : error ? (
            <div className="flex items-center justify-center py-8">
              <p className="text-red-500">{error}</p>
            </div>
          ) : (
            <TimesheetAttendanceTable
              columns={columns}
              data={attendanceRecords}
            />
          )}
        </div>

        <div className="flex justify-end pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
