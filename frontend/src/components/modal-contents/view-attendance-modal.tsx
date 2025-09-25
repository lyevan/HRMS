import type { JSX } from "react";
import type { AttendanceRecord } from "@/models/attendance-model";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Clock,
  Calendar,
  User,
  FileText,
  DollarSign,
  Briefcase,
  AlertTriangle,
} from "lucide-react";

interface ViewModalContentProps {
  selectedRecord: AttendanceRecord | null;
  getStatusBadges: (record: AttendanceRecord, isSmall: boolean) => JSX.Element;
}

export const viewModalContent = ({
  selectedRecord,
  getStatusBadges,
}: ViewModalContentProps) => {
  if (!selectedRecord) return null;

  const payrollBreakdown = selectedRecord.payroll_breakdown;
  const workedHours = payrollBreakdown?.worked_hours;
  const deductions = payrollBreakdown?.deductions;
  const schedule = payrollBreakdown?.schedule;

  return (
    <div className="space-y-6 max-h-[80vh] overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Attendance Record Details</h2>
          <p className="text-sm text-muted-foreground mt-1">
            {selectedRecord.first_name} {selectedRecord.last_name} •{" "}
            {selectedRecord.employee_id}
          </p>
        </div>
        <div className="flex flex-wrap gap-1">
          {getStatusBadges(selectedRecord, false)}
        </div>
      </div>

      <Separator />

      {/* Basic Information */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <User className="h-4 w-4" />
            Basic Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Date
              </label>
              <p className="text-sm font-medium mt-1">
                {new Date(selectedRecord.date).toLocaleDateString("en-US", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Time In
              </label>
              <p className="text-sm font-medium mt-1 flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {selectedRecord.time_in
                  ? new Date(selectedRecord.time_in).toLocaleTimeString(
                      "en-US",
                      {
                        hour: "2-digit",
                        minute: "2-digit",
                        hour12: true,
                      }
                    )
                  : "--"}
              </p>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Time Out
              </label>
              <p className="text-sm font-medium mt-1 flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {selectedRecord.time_out
                  ? new Date(selectedRecord.time_out).toLocaleTimeString(
                      "en-US",
                      {
                        hour: "2-digit",
                        minute: "2-digit",
                        hour12: true,
                      }
                    )
                  : "--"}
              </p>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Duration
              </label>
              <p className="text-sm font-medium mt-1">
                {selectedRecord.time_in && selectedRecord.time_out
                  ? (() => {
                      const start = new Date(selectedRecord.time_in!);
                      const end = new Date(selectedRecord.time_out!);
                      const diffMs = end.getTime() - start.getTime();
                      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
                      const diffMinutes = Math.floor(
                        (diffMs % (1000 * 60 * 60)) / (1000 * 60)
                      );
                      return `${diffHours}h ${diffMinutes}m`;
                    })()
                  : "--"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Hours Summary */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Briefcase className="h-4 w-4" />
            Hours Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Total Hours
              </label>
              <p className="text-lg font-semibold mt-1 text-primary">
                {selectedRecord.total_hours
                  ? `${selectedRecord.total_hours}h`
                  : "0h"}
              </p>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Regular Hours
              </label>
              <p className="text-sm font-medium mt-1">
                {workedHours?.regular?.value
                  ? `${workedHours.regular.value}h`
                  : "0h"}
              </p>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Overtime Hours
              </label>
              <p className="text-sm font-medium mt-1 text-orange-600">
                {selectedRecord.overtime_hours
                  ? `${selectedRecord.overtime_hours}h`
                  : "0h"}
              </p>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Night Diff Hours
              </label>
              <p className="text-sm font-medium mt-1 text-blue-600">
                {selectedRecord.night_differential_hours
                  ? `${selectedRecord.night_differential_hours}h`
                  : "0h"}
              </p>
            </div>
          </div>

          {/* Special Hours */}
          {(selectedRecord.rest_day_hours_worked ||
            (workedHours?.regular_holiday?.value || 0) > 0 ||
            (workedHours?.special_holiday?.value || 0) > 0) && (
            <div className="mt-4 pt-4 border-t">
              <h4 className="text-sm font-medium mb-2">Special Hours</h4>
              <div className="flex flex-wrap gap-2">
                {selectedRecord.rest_day_hours_worked && (
                  <Badge variant="secondary">
                    Rest Day: {selectedRecord.rest_day_hours_worked}h
                  </Badge>
                )}
                {(workedHours?.regular_holiday?.value || 0) > 0 && (
                  <Badge variant="secondary">
                    Regular Holiday: {workedHours?.regular_holiday?.value || 0}h
                  </Badge>
                )}
                {(workedHours?.special_holiday?.value || 0) > 0 && (
                  <Badge variant="secondary">
                    Special Holiday: {workedHours?.special_holiday?.value || 0}h
                  </Badge>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Schedule Information */}
      {schedule && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Schedule Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Start Time:</span>
                <p className="font-medium">{schedule.start_time || "N/A"}</p>
              </div>
              <div>
                <span className="text-muted-foreground">End Time:</span>
                <p className="font-medium">{schedule.end_time || "N/A"}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Break Start:</span>
                <p className="font-medium">{schedule.break_start || "N/A"}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Break End:</span>
                <p className="font-medium">{schedule.break_end || "N/A"}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Deductions */}
      {deductions &&
        (deductions.late_hours > 0 || deductions.undertime_hours > 0) && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2 text-orange-600">
                <AlertTriangle className="h-4 w-4" />
                Deductions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {deductions.late_hours > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Late Hours:</span>
                    <span className="text-sm font-medium text-orange-600">
                      -{deductions.late_hours}h
                    </span>
                  </div>
                )}
                {deductions.undertime_hours > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Undertime Hours:</span>
                    <span className="text-sm font-medium text-orange-600">
                      -{deductions.undertime_hours}h
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

      {/* Notes */}
      {selectedRecord.notes && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Notes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-relaxed p-3 bg-muted rounded-md">
              {selectedRecord.notes}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Payroll Breakdown (Advanced) */}
      {payrollBreakdown && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Payroll Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Worked Hours Breakdown */}
              <div>
                <h4 className="text-sm font-medium mb-2">
                  Worked Hours by Type
                </h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {workedHours?.regular?.value && (
                    <div className="flex justify-between">
                      <span>Regular:</span>
                      <span className="font-medium">
                        {workedHours?.regular?.value}h
                      </span>
                    </div>
                  )}
                  {workedHours?.night_diff?.value && (
                    <div className="flex justify-between">
                      <span>Night Diff:</span>
                      <span className="font-medium">
                        {workedHours?.night_diff?.value}h
                      </span>
                    </div>
                  )}
                  {workedHours?.rest_day?.value && (
                    <div className="flex justify-between">
                      <span>Rest Day:</span>
                      <span className="font-medium">
                        {workedHours?.rest_day?.value}h
                      </span>
                    </div>
                  )}
                  {workedHours?.regular_holiday?.value && (
                    <div className="flex justify-between">
                      <span>Regular Holiday:</span>
                      <span className="font-medium">
                        {workedHours?.regular_holiday?.value}h
                      </span>
                    </div>
                  )}
                  {workedHours?.special_holiday?.value && (
                    <div className="flex justify-between">
                      <span>Special Holiday:</span>
                      <span className="font-medium">
                        {workedHours?.special_holiday?.value}h
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Edge Cases */}
              {payrollBreakdown.edge_case_flags && (
                <div>
                  <h4 className="text-sm font-medium mb-2">Processing Flags</h4>
                  <div className="flex flex-wrap gap-1">
                    {payrollBreakdown.edge_case_flags.is_day_off && (
                      <Badge variant="outline" className="text-xs">
                        Day Off
                      </Badge>
                    )}
                    {payrollBreakdown.edge_case_flags.is_regular_holiday && (
                      <Badge variant="outline" className="text-xs">
                        Regular Holiday
                      </Badge>
                    )}
                    {payrollBreakdown.edge_case_flags.is_special_holiday && (
                      <Badge variant="outline" className="text-xs">
                        Special Holiday
                      </Badge>
                    )}
                    {payrollBreakdown.edge_case_flags
                      .has_night_differential && (
                      <Badge variant="outline" className="text-xs">
                        Night Diff
                      </Badge>
                    )}
                    {payrollBreakdown.edge_case_flags.has_overtime && (
                      <Badge variant="outline" className="text-xs">
                        Overtime
                      </Badge>
                    )}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
