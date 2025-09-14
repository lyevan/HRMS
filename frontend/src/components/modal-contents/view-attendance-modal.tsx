import type { JSX } from "react";
import type { AttendanceRecord } from "@/models/attendance-model";

interface ViewModalContentProps {
  selectedRecord: AttendanceRecord | null;
  getStatusBadges: (record: AttendanceRecord, isSmall: boolean) => JSX.Element;
}

export const viewModalContent = ({
  selectedRecord,
  getStatusBadges,
}: ViewModalContentProps) => {
  if (!selectedRecord) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Attendance Record Details</h2>
        <div className="flex flex-wrap gap-1">
          {getStatusBadges(selectedRecord, false)}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium text-muted-foreground">
            Employee
          </label>
          <p className="text-sm font-medium">
            {selectedRecord.first_name} {selectedRecord.last_name}
          </p>
          <p className="text-xs text-muted-foreground">
            {selectedRecord.employee_id}
          </p>
        </div>
        <div>
          <label className="text-sm font-medium text-muted-foreground">
            Date
          </label>
          <p className="text-sm">
            {new Date(selectedRecord.date).toLocaleDateString()}
          </p>
        </div>
        <div>
          <label className="text-sm font-medium text-muted-foreground">
            Time In
          </label>
          <p className="text-sm">
            {selectedRecord.time_in
              ? new Date(selectedRecord.time_in).toLocaleTimeString("en-US", {
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : "--"}
          </p>
        </div>
        <div>
          <label className="text-sm font-medium text-muted-foreground">
            Time Out
          </label>
          <p className="text-sm">
            {selectedRecord.time_out
              ? new Date(selectedRecord.time_out).toLocaleTimeString("en-US", {
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : "--"}
          </p>
        </div>
        <div>
          <label className="text-sm font-medium text-muted-foreground">
            Total Hours
          </label>
          <p className="text-sm">
            {selectedRecord.total_hours
              ? `${selectedRecord.total_hours}h`
              : "--"}
          </p>
        </div>
        <div>
          <label className="text-sm font-medium text-muted-foreground">
            Overtime Hours
          </label>
          <p className="text-sm">
            {selectedRecord.overtime_hours
              ? `${selectedRecord.overtime_hours}h`
              : "0h"}
          </p>
        </div>
      </div>

      {selectedRecord.notes && (
        <div>
          <label className="text-sm font-medium text-muted-foreground">
            Notes
          </label>
          <p className="text-sm mt-1 p-3 bg-muted rounded-md">
            {selectedRecord.notes}
          </p>
        </div>
      )}
    </div>
  );
};
