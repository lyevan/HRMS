import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  CheckCircle,
  XCircle,
  Clock,
  User,
  AlertTriangle,
  Upload,
  Search,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { formatDate } from "@/lib/stringMethods";

interface AttendanceRecord {
  employee_id: string;
  employee_name: string;
  employee_position: string;
  has_schedule: boolean;
  schedule_name?: string;
  date: string;
  time_in?: string;
  time_out?: string;
  total_hours?: number;
  overtime_hours?: number;
  is_present: boolean;
  is_absent: boolean;
  is_late: boolean;
  is_undertime: boolean;
  is_halfday: boolean;
  is_dayoff: boolean;
  is_regular_holiday: boolean;
  is_special_holiday: boolean;
  on_leave: boolean;
  leave_type_id?: number;
  leave_request_id?: number;
  notes?: string;
}

interface BulkAttendancePreviewProps {
  records: AttendanceRecord[];
  summary: {
    employeesAffected: number;
    recordsWithTimeIn: number;
    recordsWithTimeOut: number;
    dayOffRecords: number;
    holidayRecords: number;
    presentRecords: number;
    absentRecords: number;
    leaveRecords: number;
  };
  warnings?: {
    employeesWithoutSchedule?: {
      count: number;
      employeeIds: string[];
      employees: Array<{
        employee_id: string;
        name: string;
        position: string;
      }>;
      message: string;
    };
    duplicateRecords?: {
      count: number;
      warnings: Array<{
        type: string;
        employee_id: string;
        date: string;
        attendance_id?: number;
        message: string;
        existing_data?: {
          is_present: boolean;
          is_absent: boolean;
          on_leave: boolean;
          time_in?: string;
          time_out?: string;
          total_hours?: number;
          created_at: string;
        };
        rows?: number[];
      }>;
      message: string;
      requiresConfirmation?: boolean;
    };
  };
  sessionId: string;
  onSubmit: (
    records: AttendanceRecord[],
    sessionId: string,
    overwriteExisting?: boolean
  ) => void;
  onCancel: () => void;
  isSubmitting: boolean;
}

export default function BulkAttendancePreview({
  records,
  summary,
  warnings,
  sessionId,
  onSubmit,
  onCancel,
  isSubmitting,
}: BulkAttendancePreviewProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const recordsPerPage = 10;

  // Filter records
  const filteredRecords = records.filter((record) => {
    const matchesSearch =
      record.employee_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.employee_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.employee_position.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFilter =
      statusFilter === "all" ||
      (statusFilter === "present" && record.is_present) ||
      (statusFilter === "absent" && record.is_absent) ||
      (statusFilter === "leave" && record.on_leave) ||
      (statusFilter === "dayoff" && record.is_dayoff) ||
      (statusFilter === "holiday" &&
        (record.is_regular_holiday || record.is_special_holiday)) ||
      (statusFilter === "late" && record.is_late) ||
      (statusFilter === "undertime" && record.is_undertime) ||
      (statusFilter === "halfday" && record.is_halfday) ||
      (statusFilter === "no-schedule" && !record.has_schedule) ||
      (statusFilter === "present-dayoff" &&
        record.is_present &&
        record.is_dayoff);

    return matchesSearch && matchesFilter;
  });

  // Pagination
  const totalPages = Math.ceil(filteredRecords.length / recordsPerPage);
  const startIndex = (currentPage - 1) * recordsPerPage;
  const endIndex = startIndex + recordsPerPage;
  const currentRecords = filteredRecords.slice(startIndex, endIndex);

  const getStatusBadges = (record: AttendanceRecord) => {
    const badges = [];

    // Primary status badges
    if (record.is_present) {
      badges.push(
        <Badge
          key="present"
          className="bg-green-100 text-green-800 border-green-300"
        >
          <CheckCircle className="h-3 w-3 mr-1" />
          Present
        </Badge>
      );
    }
    if (record.is_absent) {
      badges.push(
        <Badge key="absent" className="bg-red-100 text-red-800 border-red-300">
          <XCircle className="h-3 w-3 mr-1" />
          Absent
        </Badge>
      );
    }
    if (record.on_leave) {
      badges.push(
        <Badge
          key="leave"
          className="bg-blue-100 text-blue-800 border-blue-300"
        >
          <User className="h-3 w-3 mr-1" />
          On Leave
        </Badge>
      );
    }

    // Secondary status badges
    if (record.is_late) {
      badges.push(
        <Badge
          key="late"
          className="bg-orange-100 text-orange-800 border-orange-300"
        >
          <Clock className="h-3 w-3 mr-1" />
          Late
        </Badge>
      );
    }
    if (record.is_undertime) {
      badges.push(
        <Badge
          key="undertime"
          className="bg-yellow-100 text-yellow-800 border-yellow-300"
        >
          <Clock className="h-3 w-3 mr-1" />
          Undertime
        </Badge>
      );
    }
    if (record.is_halfday) {
      badges.push(
        <Badge
          key="halfday"
          className="bg-indigo-100 text-indigo-800 border-indigo-300"
        >
          <Clock className="h-3 w-3 mr-1" />
          Half Day
        </Badge>
      );
    }

    // Special day badges
    if (record.is_dayoff) {
      badges.push(
        <Badge
          key="dayoff"
          className="bg-gray-100 text-gray-800 border-gray-300"
        >
          <Clock className="h-3 w-3 mr-1" />
          Day Off
        </Badge>
      );
    }
    if (record.is_regular_holiday) {
      badges.push(
        <Badge
          key="regular-holiday"
          className="bg-purple-100 text-purple-800 border-purple-300"
        >
          <AlertTriangle className="h-3 w-3 mr-1" />
          Regular Holiday
        </Badge>
      );
    }
    if (record.is_special_holiday) {
      badges.push(
        <Badge
          key="special-holiday"
          className="bg-pink-100 text-pink-800 border-pink-300"
        >
          <AlertTriangle className="h-3 w-3 mr-1" />
          Special Holiday
        </Badge>
      );
    }

    // Warning badge for employees without schedule
    if (!record.has_schedule) {
      badges.push(
        <Badge
          key="no-schedule"
          variant="outline"
          className="border-amber-300 text-amber-700"
        >
          <AlertTriangle className="h-3 w-3 mr-1" />
          No Schedule
        </Badge>
      );
    }

    return badges.length > 0 ? (
      <div className="flex flex-wrap gap-1">{badges}</div>
    ) : (
      <Badge variant="outline">
        <Clock className="h-3 w-3 mr-1" />
        Unknown
      </Badge>
    );
  };

  const handleSubmit = () => {
    // Check if there are duplicate warnings that require confirmation
    const hasDuplicateWarnings =
      warnings?.duplicateRecords?.requiresConfirmation;

    if (hasDuplicateWarnings) {
      setShowConfirmModal(true);
    } else {
      // No duplicates, submit directly
      onSubmit(records, sessionId, false);
    }
  };

  const confirmSubmit = () => {
    // Submit with overwrite confirmation
    onSubmit(records, sessionId, true);
    // setShowConfirmModal(false);
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Records</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{records.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Employees</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {summary.employeesAffected}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Present</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {summary.presentRecords}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Absent</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {summary.absentRecords}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Warnings */}
      {warnings?.employeesWithoutSchedule && (
        <Card className="border-amber-200 bg-amber-50">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
              <CardTitle className="text-amber-800">Schedule Warning</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-amber-700 mb-3">
              {warnings.employeesWithoutSchedule.message}
            </p>
            <div className="space-y-2">
              <p className="text-sm font-medium text-amber-800">
                Affected employees ({warnings.employeesWithoutSchedule.count}):
              </p>
              <div className="flex flex-wrap gap-2">
                {warnings.employeesWithoutSchedule.employees.map((emp) => (
                  <Badge
                    key={emp.employee_id}
                    variant="outline"
                    className="border-amber-300 text-amber-700"
                  >
                    {emp.employee_id} - {emp.name}
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Duplicate Records Warning */}
      {warnings?.duplicateRecords && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
              <CardTitle className="text-orange-800">
                Duplicate Records Warning
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-orange-700 mb-3">
              {warnings.duplicateRecords.message}
            </p>
            <div className="space-y-3">
              <p className="text-sm font-medium text-orange-800">
                Affected records ({warnings.duplicateRecords.count}):
              </p>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {warnings.duplicateRecords.warnings.map((warning, index) => (
                  <div
                    key={index}
                    className="p-2 bg-orange-100 rounded-md border border-orange-200"
                  >
                    <div className="flex justify-between items-start gap-2">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-orange-800">
                          {warning.employee_id} - {warning.date}
                        </p>
                        {warning.existing_data && (
                          <div className="text-xs text-orange-600 mt-1">
                            Existing:{" "}
                            {warning.existing_data.is_present
                              ? "Present"
                              : warning.existing_data.is_absent
                              ? "Absent"
                              : warning.existing_data.on_leave
                              ? "On Leave"
                              : "Unknown"}
                            {warning.existing_data.time_in && (
                              <span>
                                {" "}
                                • {
                                  warning.existing_data.time_in.split(" ")[1]
                                }{" "}
                                -{" "}
                                {warning.existing_data.time_out?.split(
                                  " "
                                )[1] || "No out"}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                      <Badge
                        variant="outline"
                        className="border-orange-300 text-orange-700 text-xs"
                      >
                        Will Overwrite
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
              {warnings.duplicateRecords.requiresConfirmation && (
                <div className="p-3 bg-orange-100 border border-orange-300 rounded-md">
                  <p className="text-sm font-medium text-orange-800">
                    ⚠️ Confirmation Required: Proceeding will overwrite existing
                    attendance records.
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <Label htmlFor="search" className="sr-only">
            Search
          </Label>
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              id="search"
              placeholder="Search by employee ID, name, or position..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <div className="w-full sm:w-48">
          <Label htmlFor="status-filter" className="sr-only">
            Filter by status
          </Label>
          <select
            id="status-filter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm"
          >
            <option value="all">All Records</option>
            <option value="present">Present</option>
            <option value="absent">Absent</option>
            <option value="leave">On Leave</option>
            <option value="late">Late</option>
            <option value="undertime">Undertime</option>
            <option value="halfday">Half Day</option>
            <option value="dayoff">Day Off</option>
            <option value="holiday">Holiday</option>
            <option value="no-schedule">No Schedule</option>
            <option value="present-dayoff">Present on Day Off</option>
          </select>
        </div>
      </div>

      {/* Records Table */}
      <Card>
        <CardHeader>
          <CardTitle>Attendance Records Preview</CardTitle>
          <p className="text-sm text-muted-foreground">
            Showing {startIndex + 1} to{" "}
            {Math.min(endIndex, filteredRecords.length)} of{" "}
            {filteredRecords.length} records
          </p>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Schedule</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Time In</TableHead>
                  <TableHead>Time Out</TableHead>
                  <TableHead>Hours</TableHead>
                  <TableHead className="min-w-[200px]">Status</TableHead>
                  <TableHead>Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentRecords.map((record, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      <div>
                        <div className="font-medium">
                          {record.employee_name}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {record.employee_id} • {record.employee_position}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {record.has_schedule ? (
                        <div className="text-sm">
                          <div className="font-medium">
                            {record.schedule_name}
                          </div>
                        </div>
                      ) : (
                        <Badge
                          variant="outline"
                          className="border-amber-300 text-amber-700"
                        >
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          No Schedule
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>{formatDate(record.date)}</TableCell>
                    <TableCell>
                      {record.time_in
                        ? new Date(record.time_in).toLocaleTimeString("en-US", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "--"}
                    </TableCell>
                    <TableCell>
                      {record.time_out
                        ? new Date(record.time_out).toLocaleTimeString(
                            "en-US",
                            {
                              hour: "2-digit",
                              minute: "2-digit",
                            }
                          )
                        : "--"}
                    </TableCell>
                    <TableCell>
                      {record.total_hours ? `${record.total_hours}h` : "--"}
                      {record.overtime_hours && record.overtime_hours > 0 && (
                        <div className="text-xs text-blue-600">
                          +{record.overtime_hours}h OT
                        </div>
                      )}
                    </TableCell>
                    <TableCell>{getStatusBadges(record)}</TableCell>
                    <TableCell className="max-w-xs truncate">
                      {record.notes || "--"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-muted-foreground">
                Page {currentPage} of {totalPages}
              </div>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(prev - 1, 1))
                  }
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                  }
                  disabled={currentPage === totalPages}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex justify-end space-x-2">
        <Button variant="outline" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button onClick={handleSubmit} disabled={isSubmitting}>
          <Upload className="h-4 w-4 mr-2" />
          {isSubmitting ? "Uploading..." : `Upload ${records.length} Records`}
        </Button>
      </div>

      {/* Confirmation Modal */}
      <Dialog open={showConfirmModal} onOpenChange={setShowConfirmModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Bulk Upload</DialogTitle>
            <DialogDescription>
              <p className="text-destructive">
                You are about to upload {records.length} attendance records to
                the database. This action cannot be undone.
              </p>
              {warnings?.duplicateRecords &&
                warnings.duplicateRecords.count > 0 && (
                  <p className="text-amber-600 mt-2 font-medium">
                    ⚠️ This will overwrite {warnings.duplicateRecords.count}{" "}
                    existing attendance records.
                  </p>
                )}
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <strong>Records to upload:</strong>
                <ul className="mt-1 space-y-1 text-muted-foreground">
                  <li>• Total Records: {records.length}</li>
                  <li>• Present: {summary.presentRecords}</li>
                  <li>• Absent: {summary.absentRecords}</li>
                  <li>• On Leave: {summary.leaveRecords}</li>
                </ul>
              </div>
              <div>
                <strong>Affected:</strong>
                <ul className="mt-1 space-y-1 text-muted-foreground">
                  <li>• Employees: {summary.employeesAffected}</li>
                  <li>• Day Off: {summary.dayOffRecords}</li>
                  <li>• Holidays: {summary.holidayRecords}</li>
                  {warnings?.duplicateRecords &&
                    warnings.duplicateRecords.count > 0 && (
                      <li className="text-amber-600">
                        • Overwrites: {warnings.duplicateRecords.count}
                      </li>
                    )}
                </ul>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowConfirmModal(false)}
            >
              Cancel
            </Button>
            <Button onClick={confirmSubmit} disabled={isSubmitting}>
              {isSubmitting
                ? "Uploading..."
                : warnings?.duplicateRecords &&
                  warnings.duplicateRecords.count > 0
                ? "Confirm Upload & Overwrite"
                : "Confirm Upload"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
