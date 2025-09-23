import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Eye,
  Edit,
  MoreHorizontal,
  CircleQuestionMark,
  LogIn,
  LogOut,
  AlarmClockPlus,
  AlarmClockMinus,
  CalendarDays,
  Coffee,
} from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";
import type { AttendanceRecord } from "@/models/attendance-model";
import type { JSX } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { getAllDaysWithScheduleStatus } from "@/lib/stringMethods";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

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
      const formattedDate = date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
      const dayNames = [
        "Sunday",
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
      ];
      const dayName = dayNames[date.getDay()];
      return (
        <div>
          <p>{formattedDate}</p>
          <p className="text-xs text-muted-foreground">{dayName}</p>
        </div>
      );
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
      </div>
    ),
  },
  {
    accessorKey: "schedule",
    header: "Schedule",
    cell: ({ row }) => {
      const startTime = row.original.start_time as string | null;
      const endTime = row.original.end_time as string | null;

      // Format time strings like "08:00:00" to "8:00 AM"
      const formatTimeString = (timeStr: string | null): string => {
        if (!timeStr) return "--";

        // Parse HH:MM:SS or HH:MM format
        const parts = timeStr.split(":");
        const hours = parseInt(parts[0], 10);
        const minutes = parseInt(parts[1] || "0", 10);

        // Create a date object for today with the specified time
        const date = new Date();
        date.setHours(hours, minutes, 0, 0);

        return date.toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
        });
      };

      const startTimeFormatted = formatTimeString(startTime);
      const endTimeFormatted = formatTimeString(endTime);

      return (
        <Popover>
          <PopoverTrigger className="flex items-center gap-2 w-full cursor-pointer">
            <div className="flex flex-col gap-1 w-fit">
              <div className="flex items-center justify-between gap-4">
                <AlarmClockPlus className="text-primary" size={16} />
                <p className="text-xs">{startTimeFormatted}</p>
              </div>
              <div className="flex items-center justify-between gap-4">
                <AlarmClockMinus className="text-destructive" size={16} />
                <p className="text-xs">{endTimeFormatted}</p>
              </div>
            </div>
            <CircleQuestionMark
              size={12}
              className="text-muted-foreground self-start"
            />
          </PopoverTrigger>
          <PopoverContent
            className="w-64 bg-primary/20 backdrop-blur-3xl border border-primary"
            side="top"
          >
            <div className="space-y-2">
              <div className="text-xs space-y-2 text-card-foreground">
                <div>
                  <div className="font-medium flex items-center gap-2">
                    <CalendarDays size={16} />
                    <p>Scheduled Days:</p>
                  </div>
                  {row.original.days_of_week &&
                    row.original.days_of_week.length > 0 && (
                      <div className="flex flex-wrap gap-1 my-2">
                        {getAllDaysWithScheduleStatus(
                          row.original.days_of_week
                        ).map(({ day, isScheduled }) => (
                          <Badge
                            key={day}
                            variant="outline"
                            className={`text-[0.5rem] px-2 py-1 ${
                              isScheduled
                                ? "border-primary/50 text-primary bg-primary/5"
                                : "border-destructive/50 text-destructive bg-destructive/5"
                            }`}
                          >
                            {day.charAt(0).toUpperCase() + day.slice(1, 2)}
                          </Badge>
                        ))}
                      </div>
                    )}
                </div>
                <Separator />
                <div className="space-y-2">
                  <div className="font-medium flex items-center gap-2">
                    <Coffee size={16} />
                    <p>Break Info:</p>
                  </div>
                  {row.original.break_start && row.original.break_end ? (
                    <div className="flex justify-between pl-10">
                      <span className="font-medium">Time:</span>
                      <span>
                        {formatTimeString(row.original.break_start)} -{" "}
                        {formatTimeString(row.original.break_end)}
                      </span>
                    </div>
                  ) : null}
                  {row.original.break_duration !== null &&
                  row.original.break_duration !== undefined ? (
                    <div className="flex justify-between pl-10">
                      <span className="font-medium">Duration:</span>
                      <span>
                        {Number(row.original.break_duration).toFixed(0)} min
                      </span>
                    </div>
                  ) : (
                    <div>No break assigned</div>
                  )}
                </div>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      );
    },
  },
  {
    accessorKey: "records",
    header: "Time Records",
    cell: ({ row }) => {
      const timeIn = row.original.time_in as string | null;
      const timeOut = row.original.time_out as string | null;
      let timeInFormatted = "--";
      let timeOutFormatted = "--";
      if (timeIn) {
        timeInFormatted = new Date(timeIn).toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
        });
      }
      if (timeOut) {
        timeOutFormatted = new Date(timeOut).toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
        });
      }

      return (
        <div className="flex flex-col gap-1 w-fit">
          <div className="flex items-center justify-between gap-4">
            <LogIn className="text-primary" size={16} />
            <p className="text-xs">{timeInFormatted}</p>
          </div>
          <div className="flex items-center justify-between gap-4">
            <LogOut className="text-destructive" size={14} />
            <p className="text-xs">{timeOutFormatted}</p>
          </div>
        </div>
      );
    },
  },
  // {
  //   accessorKey: "time_in",
  //   header: "Time In",
  //   cell: ({ row }) => {
  //     const timeIn = row.getValue("time_in") as string | null;
  //     if (!timeIn) return <span className="text-muted-foreground">--</span>;
  //     return new Date(timeIn).toLocaleTimeString("en-US", {
  //       hour: "2-digit",
  //       minute: "2-digit",
  //     });
  //   },
  // },
  // {
  //   accessorKey: "time_out",
  //   header: "Time Out",
  //   cell: ({ row }) => {
  //     const timeOut = row.getValue("time_out") as string | null;
  //     if (!timeOut) return <span className="text-muted-foreground">--</span>;
  //     return new Date(timeOut).toLocaleTimeString("en-US", {
  //       hour: "2-digit",
  //       minute: "2-digit",
  //     });
  //   },
  // },
  {
    accessorKey: "total_hours",
    header: "Hours Worked",
    cell: ({ row }) => {
      const hours = row.getValue("total_hours") as number | null;
      if (hours === null || hours === undefined) {
        return <span className="text-muted-foreground">--</span>;
      }
      return `${Number(hours).toFixed(1)}h`;
    },
  },
  {
    accessorKey: "payroll_breakdown",
    header: "OT Hours",
    cell: ({ row }) => {
      const breakdown = row.getValue(
        "payroll_breakdown"
      ) as AttendanceRecord["payroll_breakdown"];
      const hours = breakdown?.overtime.computed.total;
      if (!hours || hours === 0)
        return <span className="text-muted-foreground">--</span>;
      return (
        <Popover>
          <PopoverTrigger className="flex items-center gap-2 w-2/3 cursor-pointer">
            <span className="text-primary w-1/2 text-start font-medium flex-1 data-[state=open]:text-accent">
              {hours}h
            </span>
            <CircleQuestionMark
              size={12}
              className="text-muted-foreground self-start"
            />
          </PopoverTrigger>
          <PopoverContent
            className="w-48 bg-primary/20 backdrop-blur-3xl border border-primary"
            side="top"
          >
            <div className="space-y-2">
              <div className="text-xs space-y-2 text-card-foreground">
                <div className="flex justify-between">
                  <span className="font-medium">Regular OT:</span>
                  <span>
                    {breakdown?.overtime.computed.regular_overtime.value || 0}h
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Rest Day OT:</span>
                  {breakdown?.overtime.computed.rest_day_overtime || 0}h
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Night Differential OT:</span>{" "}
                  {breakdown?.overtime.computed.night_diff_overtime || 0}h
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Special Holiday OT:</span>{" "}
                  {breakdown?.overtime.computed.special_holiday_overtime || 0}h
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Regular Holiday OT:</span>{" "}
                  {breakdown?.overtime.computed.regular_holiday_overtime || 0}h
                </div>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      );
    },
  },
  // {
  //   accessorKey: "night_differential_hours",
  //   header: "Night Diff",
  //   cell: ({ row }) => {
  //     const hours = row.getValue("night_differential_hours") as number | null;
  //     if (!hours || hours === 0)
  //       return <span className="text-muted-foreground">--</span>;
  //     return <span className="text-purple-600 font-medium">{hours}h</span>;
  //   },
  // },
  // {
  //   accessorKey: "rest_day_hours_worked",
  //   header: "Rest Day",
  //   cell: ({ row }) => {
  //     const hours = row.getValue("rest_day_hours_worked") as number | null;
  //     if (!hours || hours === 0)
  //       return <span className="text-muted-foreground">--</span>;
  //     return <span className="text-orange-600 font-medium">{hours}h</span>;
  //   },
  // },
  {
    id: "status",
    header: "Status",
    cell: ({ row }) => {
      const record = row.original;
      return getStatusBadges(record);
    },
  },
  // {
  //   accessorKey: "notes",
  //   header: "Notes",
  //   cell: ({ row }) => {
  //     const notes = row.getValue("notes") as string | null;
  //     if (!notes) return <span className="text-muted-foreground">--</span>;
  //     return (
  //       <div className="max-w-[200px] truncate" title={notes}>
  //         {notes}
  //       </div>
  //     );
  //   },
  // },
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
