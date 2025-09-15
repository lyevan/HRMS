import type { ColumnDef } from "@tanstack/react-table";
import type { AttendanceRecord } from "@/models/attendance-model";
import type { JSX } from "react";

interface ProcessTimesheetColumnsProps {
  getStatusBadges: (record: AttendanceRecord) => JSX.Element;
}

export const createProcessTimesheetColumns = ({
  getStatusBadges,
}: ProcessTimesheetColumnsProps): ColumnDef<AttendanceRecord>[] => [
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
      if (!timeOut) return <span className="text-muted-foreground">--</span>;
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
    accessorKey: "overtime_hours",
    header: "OT Hours",
    cell: ({ row }) => {
      const hours = row.getValue("overtime_hours") as number | null;
      if (!hours || hours === 0)
        return <span className="text-muted-foreground">--</span>;
      return <span className="text-blue-600 font-medium">{hours}h</span>;
    },
  },
  {
    accessorKey: "night_differential_hours",
    header: "Night Diff",
    cell: ({ row }) => {
      const hours = row.getValue("night_differential_hours") as number | null;
      if (!hours || hours === 0)
        return <span className="text-muted-foreground">--</span>;
      return <span className="text-purple-600 font-medium">{hours}h</span>;
    },
  },
  {
    accessorKey: "rest_day_hours_worked",
    header: "Rest Day",
    cell: ({ row }) => {
      const hours = row.getValue("rest_day_hours_worked") as number | null;
      if (!hours || hours === 0)
        return <span className="text-muted-foreground">--</span>;
      return <span className="text-orange-600 font-medium">{hours}h</span>;
    },
  },
  {
    id: "status",
    header: "Status",
    cell: ({ row }) => {
      const record = row.original;
      return getStatusBadges(record);
    },
  },
];
