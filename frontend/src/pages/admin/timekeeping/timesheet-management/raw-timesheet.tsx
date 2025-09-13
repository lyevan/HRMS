import { useEffect, useMemo, useState } from "react";
import { useAttendanceStore } from "@/store/attendanceStore";
import { AttendanceTable } from "@/components/tables/attendance-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Eye, Edit, MoreHorizontal } from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";
import type { AttendanceRecord } from "@/models/attendance-model";
import {
  getAttendanceStatusText,
  getAttendanceStatusColor,
} from "@/models/attendance-model";

const RawTimesheet = () => {
  const { attendanceRecords, loading, error, fetchAttendanceRecords } =
    useAttendanceStore();

  // Modal state
  const [selectedRecord, setSelectedRecord] = useState<AttendanceRecord | null>(
    null
  );
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);

  useEffect(() => {
    fetchAttendanceRecords();
  }, [fetchAttendanceRecords]);

  const handleViewRecord = (record: AttendanceRecord) => {
    setSelectedRecord(record);
    setViewModalOpen(true);
  };

  const handleEditRecord = (record: AttendanceRecord) => {
    setSelectedRecord(record);
    setEditModalOpen(true);
  };

  const handleCloseModals = () => {
    setViewModalOpen(false);
    setEditModalOpen(false);
    setSelectedRecord(null);
  };

  const handleUpdateSuccess = () => {
    fetchAttendanceRecords(); // Refresh data
    handleCloseModals();
  };

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
    ],
    []
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      {/* <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">Raw Timesheet</h1>
          <p className="text-muted-foreground">
            View and manage all attendance records
          </p>
        </div>
      </div> */}

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

      {/* View Details Modal */}
      <Dialog open={viewModalOpen} onOpenChange={setViewModalOpen}>
        <DialogContent className="max-w-2xl">
          {selectedRecord && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">
                  Attendance Record Details
                </h2>
                <Badge
                  variant="outline"
                  className={getAttendanceStatusColor(selectedRecord)}
                >
                  {getAttendanceStatusText(selectedRecord)}
                </Badge>
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
                      ? new Date(selectedRecord.time_in).toLocaleTimeString(
                          "en-US",
                          {
                            hour: "2-digit",
                            minute: "2-digit",
                          }
                        )
                      : "--"}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Time Out
                  </label>
                  <p className="text-sm">
                    {selectedRecord.time_out
                      ? new Date(selectedRecord.time_out).toLocaleTimeString(
                          "en-US",
                          {
                            hour: "2-digit",
                            minute: "2-digit",
                          }
                        )
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
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Record Modal */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent className="max-w-2xl">
          {selectedRecord && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">
                  Edit Attendance Record
                </h2>
              </div>

              <div className="text-center py-8">
                <p className="text-muted-foreground">
                  Edit functionality will be implemented with a proper form
                  component.
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  Record ID: {selectedRecord.attendance_id}
                </p>
              </div>

              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={handleCloseModals}>
                  Cancel
                </Button>
                <Button onClick={handleUpdateSuccess}>Save Changes</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RawTimesheet;
