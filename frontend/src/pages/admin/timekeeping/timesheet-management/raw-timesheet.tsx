import { useEffect, useMemo } from "react";
import { useAttendanceStore } from "@/store/attendanceStore";
import { AttendanceTable } from "@/components/tables/attendance-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { ColumnDef } from "@tanstack/react-table";
import type { AttendanceRecord } from "@/models/attendance-model";
import {
  getAttendanceStatusText,
  getAttendanceStatusColor,
} from "@/models/attendance-model";

const RawTimesheet = () => {
  const { attendanceRecords, loading, error, fetchAttendanceRecords } =
    useAttendanceStore();

  useEffect(() => {
    fetchAttendanceRecords();
  }, [fetchAttendanceRecords]);

  // Define columns for the attendance table
  const columns: ColumnDef<AttendanceRecord>[] = useMemo(
    () => [
      {
        accessorKey: "date",
        header: "Date",
        cell: ({ row }) => {
          const date = new Date(row.getValue("date"));
          return date.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          });
        },
      },
      {
        accessorKey: "employee_id",
        header: "Employee ID",
      },
      {
        accessorFn: (row) => `${row.first_name} ${row.last_name}`,
        id: "employee_name",
        header: "Employee Name",
        cell: ({ row }) => (
          <div>
            <div className="font-medium">
              {row.original.first_name} {row.original.last_name}
            </div>
            <div className="text-sm text-muted-foreground">
              {row.original.employee_id}
            </div>
          </div>
        ),
      },
      {
        accessorKey: "time_in",
        header: "Time In",
        cell: ({ row }) => {
          const timeIn = row.getValue("time_in") as string | null;
          if (!timeIn) return <span className="text-muted-foreground">--</span>;
          return new Date(timeIn).toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
          });
        },
      },
      {
        accessorKey: "time_out",
        header: "Time Out",
        cell: ({ row }) => {
          const timeOut = row.getValue("time_out") as string | null;
          if (!timeOut)
            return <span className="text-muted-foreground">--</span>;
          return new Date(timeOut).toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
          });
        },
      },
      {
        accessorKey: "total_hours",
        header: "Hours Worked",
        cell: ({ row }) => {
          const hours = row.getValue("total_hours") as number | null;
          if (hours === null || hours === undefined) {
            return <span className="text-muted-foreground">--</span>;
          }
          return `${hours}h`;
        },
      },
      {
        id: "status",
        header: "Status",
        cell: ({ row }) => {
          const record = row.original;
          const statusText = getAttendanceStatusText(record);
          const statusColor = getAttendanceStatusColor(record);

          return (
            <Badge variant="outline" className={statusColor}>
              {statusText}
            </Badge>
          );
        },
      },
      {
        accessorKey: "notes",
        header: "Notes",
        cell: ({ row }) => {
          const notes = row.getValue("notes") as string | null;
          if (!notes) return <span className="text-muted-foreground">--</span>;
          return (
            <div className="max-w-[200px] truncate" title={notes}>
              {notes}
            </div>
          );
        },
      },
    ],
    []
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">Raw Timesheet</h1>
          <p className="text-muted-foreground">
            View and manage all attendance records
          </p>
        </div>
      </div>

      {/* Attendance Table */}
      <Card>
        <CardHeader>
          <CardTitle>Attendance Records</CardTitle>
          <p className="text-sm text-muted-foreground">
            Complete attendance history with filtering and search capabilities
          </p>
        </CardHeader>
        <CardContent>
          <AttendanceTable
            columns={columns}
            data={attendanceRecords}
            loading={loading}
            error={error}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default RawTimesheet;
