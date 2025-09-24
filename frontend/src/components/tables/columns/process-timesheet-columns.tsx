import {
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
    accessorKey: "payroll_breakdown",
    id: "schedule",
    header: "Schedule",
    cell: ({ row }) => {
      const breakdown = row.original
        .payroll_breakdown as AttendanceRecord["payroll_breakdown"];
      const startTime = breakdown?.schedule.start_time as string | null;
      const endTime = breakdown?.schedule.end_time as string | null;
      const daysOfWeek = breakdown?.schedule.days_of_week as string[] | null;
      const breakStart = breakdown?.schedule.break_start as string | null;
      const breakEnd = breakdown?.schedule.break_end as string | null;
      const breakDuration = breakdown?.schedule.break_duration as number | null;

      if (!startTime || !endTime) {
        return <span className="text-muted-foreground">No schedule</span>;
      }

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
                  {daysOfWeek && daysOfWeek.length > 0 && (
                    <div className="flex flex-wrap gap-1 my-2">
                      {getAllDaysWithScheduleStatus(daysOfWeek).map(
                        ({ day, isScheduled }) => (
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
                        )
                      )}
                    </div>
                  )}
                </div>
                <Separator />
                <div className="space-y-2">
                  <div className="font-medium flex items-center gap-2">
                    <Coffee size={16} />
                    <p>Break Info:</p>
                  </div>
                  {breakStart && breakEnd ? (
                    <div className="flex justify-between pl-10">
                      <span className="font-medium">Time:</span>
                      <span>
                        {formatTimeString(breakStart)} -{" "}
                        {formatTimeString(breakEnd)}
                      </span>
                    </div>
                  ) : null}
                  {breakDuration !== null && breakDuration !== undefined ? (
                    <div className="flex justify-between pl-10">
                      <span className="font-medium">Duration:</span>
                      <span>{Number(breakDuration).toFixed(0)} min</span>
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
  {
    accessorKey: "payroll_breakdown",
    id: "hours_worked",
    header: "Hours Worked",
    cell: ({ row }) => {
      const breakdown = row.original
        .payroll_breakdown as AttendanceRecord["payroll_breakdown"];
      const totalHours = breakdown?.worked_hours.total;
      if (totalHours === null || totalHours === undefined) {
        return <span className="text-muted-foreground">--</span>;
      }
      return (
        <Popover>
          <PopoverTrigger className="flex items-center gap-2 w-2/3 cursor-pointer">
            <span className="text-primary w-1/2 text-start font-medium flex-1 data-[state=open]:text-accent">
              {Number(totalHours).toFixed(1)}h
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
                {[
                  {
                    label: "Regular",
                    value: breakdown?.worked_hours.regular.value,
                  },
                  {
                    label: "Rest Day",
                    value: breakdown?.worked_hours.rest_day.value,
                  },
                  {
                    label: "Night Diff",
                    value: breakdown?.worked_hours.night_diff.value,
                  },
                  {
                    label: "Regular Holiday",
                    value: breakdown?.worked_hours.regular_holiday.value,
                  },
                  {
                    label: "Special Holiday",
                    value: breakdown?.worked_hours.special_holiday.value,
                  },
                  {
                    label: "RH + RD",
                    value:
                      breakdown?.worked_hours.regular_holiday_rest_day.value,
                  },
                  {
                    label: "SH + RD",
                    value:
                      breakdown?.worked_hours.special_holiday_rest_day.value,
                  },
                  {
                    label: "ND + RD",
                    value: breakdown?.worked_hours.night_diff_rest_day.value,
                  },
                  {
                    label: "ND + RH",
                    value:
                      breakdown?.worked_hours.night_diff_regular_holiday.value,
                  },
                  {
                    label: "ND + SH",
                    value:
                      breakdown?.worked_hours.night_diff_special_holiday.value,
                  },
                  {
                    label: "ND + RH + RD",
                    value:
                      breakdown?.worked_hours
                        .night_diff_regular_holiday_rest_day.value,
                  },
                  {
                    label: "ND + SH + RD",
                    value:
                      breakdown?.worked_hours
                        .night_diff_special_holiday_rest_day.value,
                  },
                ].map(({ label, value }) => (
                  <div
                    key={label}
                    className={`flex justify-between ${value ? "" : "hidden"}`}
                  >
                    <span
                      className={`font-medium ${
                        value ? "underline" : "text-muted-foreground"
                      }`}
                    >
                      {label}:
                    </span>
                    <span
                      className={
                        !value ? "text-muted-foreground" : "font-bold underline"
                      }
                    >
                      {value || "-- "}h
                    </span>
                  </div>
                ))}

                <div className="flex justify-between">
                  <span
                    className={`font-medium ${
                      row.original.payroll_breakdown?.overtime.computed.total
                        ? "underline text-destructive"
                        : "text-muted-foreground"
                    }`}
                  >
                    Total Overtime:
                  </span>
                  <span
                    className={
                      !row.original.payroll_breakdown?.overtime.computed.total
                        ? "text-muted-foreground"
                        : "font-bold underline text-destructive"
                    }
                  >
                    {row.original.payroll_breakdown?.overtime.computed.total ||
                      "-- "}
                    h
                  </span>
                </div>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      );
    },
  },
  {
    accessorKey: "payroll_breakdown",
    id: "ot_hours",
    header: "OT Hours",
    cell: ({ row }) => {
      const breakdown = row.original
        .payroll_breakdown as AttendanceRecord["payroll_breakdown"];

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
                {[
                  {
                    label: "Regular OT",
                    value: breakdown?.overtime.computed.regular_overtime.value,
                  },
                  {
                    label: "Rest Day OT",
                    value: breakdown?.overtime.computed.rest_day_overtime.value,
                  },
                  {
                    label: "Night Diff OT",
                    value:
                      breakdown?.overtime.computed.night_diff_overtime.value,
                  },
                  {
                    label: "Regular Holiday OT",
                    value:
                      breakdown?.overtime.computed.regular_holiday_overtime
                        .value,
                  },
                  {
                    label: "Special Holiday OT",
                    value:
                      breakdown?.overtime.computed.special_holiday_overtime
                        .value,
                  },
                  {
                    label: "RH + RD OT",
                    value:
                      breakdown?.overtime.computed
                        .regular_holiday_rest_day_overtime.value,
                  },
                  {
                    label: "SH + RD OT",
                    value:
                      breakdown?.overtime.computed
                        .special_holiday_rest_day_overtime.value,
                  },
                  {
                    label: "ND + RD OT",
                    value:
                      breakdown?.overtime.computed.night_diff_rest_day_overtime
                        .value,
                  },
                  {
                    label: "ND + RH OT",
                    value:
                      breakdown?.overtime.computed
                        .night_diff_regular_holiday_overtime.value,
                  },
                  {
                    label: "ND + SH OT",
                    value:
                      breakdown?.overtime.computed
                        .night_diff_special_holiday_overtime.value,
                  },
                  {
                    label: "ND + RH + RD OT",
                    value:
                      breakdown?.overtime.computed
                        .night_diff_regular_holiday_rest_day_overtime.value,
                  },
                  {
                    label: "ND + SH + RD OT",
                    value:
                      breakdown?.overtime.computed
                        .night_diff_special_holiday_rest_day_overtime.value,
                  },
                ].map(({ label, value }) => (
                  <div
                    key={label}
                    className={`flex justify-between ${value ? "" : "hidden"}`}
                  >
                    <span
                      className={`font-medium ${
                        value ? "underline" : "text-muted-foreground"
                      }`}
                    >
                      {label}:
                    </span>
                    <span
                      className={
                        !value ? "text-muted-foreground" : "font-bold underline"
                      }
                    >
                      {value || "-- "}h
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </PopoverContent>
        </Popover>
      );
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
