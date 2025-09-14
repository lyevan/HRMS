import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Eye, Edit, MoreHorizontal } from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";
import type { AttendanceRecord } from "@/models/attendance-model";
import type { JSX } from "react";

interface AttendanceColumnsProps {
  getStatusBadges: (record: AttendanceRecord) => JSX.Element;
  handleViewRecord: (record: AttendanceRecord) => void;
  handleEditRecord: (record: AttendanceRecord) => void;
}

export const createAttendanceColumns = ({
  getStatusBadges,
  handleViewRecord,
  handleEditRecord,
}: AttendanceColumnsProps): ColumnDef<AttendanceRecord>[] => [
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
    id: "status",
    header: "Status",
    cell: ({ row }) => {
      const record = row.original;
      return getStatusBadges(record);
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
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => {
      const record = row.original;
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={() => handleViewRecord(record)}
              className="cursor-pointer"
            >
              <Eye className="mr-2 h-4 w-4" />
              View Details
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => handleEditRecord(record)}
              className="cursor-pointer"
            >
              <Edit className="mr-2 h-4 w-4" />
              Edit Record
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
