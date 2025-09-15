import { createColumnHelper } from "@tanstack/react-table";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { ArrowDownAZ, ArrowUpAZ, ArrowDown01, ArrowUp01 } from "lucide-react";
import { type HeaderContext } from "@tanstack/react-table";

// Interface for attendance records with employee data (matches the timesheet-view-modal interface)
interface AttendanceWithEmployee {
  attendance_id: number;
  employee_id: string;
  date: string;
  time_in: string | null;
  time_out: string | null;
  total_hours: number | null;
  overtime_hours: number | null;
  is_present: boolean;
  is_late: boolean;
  is_absent: boolean;
  status: string | null;
  // Flattened employee data from backend
  first_name: string;
  last_name: string;
  calculated_total_hours: number;
  break_duration?: number;
}

// Header component for attendance table
interface AttendanceHeadersProps<T> {
  info: HeaderContext<AttendanceWithEmployee, T>;
  name: string;
  isNumber?: boolean;
}

const AttendanceHeaders = ({
  info,
  name,
  isNumber = false,
}: AttendanceHeadersProps<any>) => {
  const sorted = info.column.getIsSorted();
  return (
    <div
      onClick={(e) => {
        e.preventDefault();
        info.column.toggleSorting(info.column.getIsSorted() === "asc");
      }}
      className="cursor-pointer select-none text-primary-foreground font-black flex w-full h-full items-center justify-start"
    >
      {name}
      {sorted === "asc" ? (
        <>
          {isNumber ? (
            <ArrowDown01 className="ml-2 size-4" />
          ) : (
            <ArrowDownAZ className="ml-2 size-4" />
          )}
        </>
      ) : sorted === "desc" ? (
        <>
          {isNumber ? (
            <ArrowUp01 className="ml-2 size-4" />
          ) : (
            <ArrowUpAZ className="ml-2 size-4" />
          )}
        </>
      ) : null}
    </div>
  );
};

const columnHelper = createColumnHelper<AttendanceWithEmployee>();

// Status badge helper function
const getStatusBadge = (record: AttendanceWithEmployee) => {
  if (record.is_absent) {
    return <Badge variant="destructive">Absent</Badge>;
  }
  if (record.is_late) {
    return <Badge variant="secondary">Late</Badge>;
  }
  if (record.is_present) {
    return <Badge variant="default">Present</Badge>;
  }
  return <Badge variant="outline">Unknown</Badge>;
};

export function timesheetAttendanceColumns() {
  return [
    columnHelper.accessor("date", {
      header: (info) => <AttendanceHeaders info={info} name="Date" />,
      cell: (info) => format(new Date(info.getValue()), "MMM dd, yyyy"),
      sortingFn: (rowA, rowB) => {
        const dateA = new Date(rowA.original.date);
        const dateB = new Date(rowB.original.date);
        return dateA.getTime() - dateB.getTime();
      },
    }),

    columnHelper.accessor((row) => `${row.first_name} ${row.last_name}`, {
      id: "employee_name",
      header: (info) => <AttendanceHeaders info={info} name="Employee" />,
      cell: (info) => (
        <div className="flex flex-col">
          <span className="font-medium">{info.getValue()}</span>
          <span className="text-sm text-muted-foreground">
            ID: {info.row.original.employee_id}
          </span>
        </div>
      ),
      sortingFn: (rowA, rowB) => {
        const nameA = `${rowA.original.first_name} ${rowA.original.last_name}`;
        const nameB = `${rowB.original.first_name} ${rowB.original.last_name}`;
        return nameA.localeCompare(nameB);
      },
      filterFn: (row, _columnId, filterValue) => {
        const fullName = `${row.original.first_name} ${row.original.last_name}`;
        return fullName.toLowerCase().includes(filterValue.toLowerCase());
      },
    }),

    columnHelper.accessor("time_in", {
      header: (info) => <AttendanceHeaders info={info} name="Time In" />,
      cell: (info) => info.getValue() || "-",
    }),

    columnHelper.accessor("time_out", {
      header: (info) => <AttendanceHeaders info={info} name="Time Out" />,
      cell: (info) => info.getValue() || "-",
    }),

    columnHelper.accessor("total_hours", {
      header: (info) => (
        <AttendanceHeaders info={info} name="Total Hours" isNumber />
      ),
      cell: (info) => {
        const hours = info.getValue();
        return hours !== null && hours !== undefined
          ? `${Number(hours).toFixed(2)}h`
          : "-";
      },
      sortingFn: (rowA, rowB) => {
        const hoursA = rowA.original.total_hours || 0;
        const hoursB = rowB.original.total_hours || 0;
        return hoursA - hoursB;
      },
    }),

    columnHelper.accessor("overtime_hours", {
      header: (info) => (
        <AttendanceHeaders info={info} name="Overtime" isNumber />
      ),
      cell: (info) => {
        const overtime = info.getValue();
        return overtime !== null && overtime !== undefined && overtime > 0 ? (
          <span className="text-orange-600">
            {Number(overtime).toFixed(2)}h
          </span>
        ) : (
          "-"
        );
      },
      sortingFn: (rowA, rowB) => {
        const overtimeA = rowA.original.overtime_hours || 0;
        const overtimeB = rowB.original.overtime_hours || 0;
        return overtimeA - overtimeB;
      },
    }),

    columnHelper.display({
      id: "status",
      header: (info) => <AttendanceHeaders info={info} name="Status" />,
      cell: (info) => getStatusBadge(info.row.original),
    }),
  ];
}

export type { AttendanceWithEmployee };
