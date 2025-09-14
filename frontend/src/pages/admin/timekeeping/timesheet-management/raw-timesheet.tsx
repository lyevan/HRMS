import { useEffect, useState } from "react";
import { useAttendanceStore } from "@/store/attendanceStore";
import { AttendanceTable } from "@/components/tables/attendance-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import type { AttendanceRecord } from "@/models/attendance-model";
import { viewModalContent } from "@/components/modal-contents/view-attendance-modal";
import { editModalContent } from "@/components/modal-contents/edit-attendance-modal";
import { createAttendanceColumns } from "@/components/tables/columns/attendance-columns";
import { getStatusBadges } from "@/lib/badge-config";
import axios from "axios";
import Modal from "@/components/modal";

const RawTimesheet = () => {
  const { attendanceRecords, loading, error, fetchAttendanceRecords } =
    useAttendanceStore();

  // Modal state
  const [selectedRecord, setSelectedRecord] = useState<AttendanceRecord | null>(
    null
  );
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  // Form state for editing
  const [editForm, setEditForm] = useState({
    date: "",
    time_in: "",
    time_out: "",
    total_hours: "",
    overtime_hours: "",
    notes: "",
    is_present: false,
    is_absent: false,
    is_late: false,
    on_leave: false,
    is_undertime: false,
    is_halfday: false,
    is_dayoff: false,
    is_regular_holiday: false,
    is_special_holiday: false,
    leave_type_id: "",
    leave_request_id: "",
  });

  useEffect(() => {
    fetchAttendanceRecords();
  }, [fetchAttendanceRecords]);

  const handleViewRecord = (record: AttendanceRecord) => {
    setSelectedRecord(record);
    setViewModalOpen(true);
  };

  const handleEditRecord = (record: AttendanceRecord) => {
    setSelectedRecord(record);

    // Populate form with existing data
    const formatDateTime = (dateTime: string | null) => {
      if (!dateTime) return "";
      return new Date(dateTime).toISOString().slice(0, 16);
    };

    const formatDate = (date: string | null) => {
      if (!date) return "";
      return new Date(date).toISOString().slice(0, 10);
    };

    setEditForm({
      date: formatDate(record.date),
      time_in: formatDateTime(record.time_in),
      time_out: formatDateTime(record.time_out),
      total_hours: record.total_hours?.toString() || "",
      overtime_hours: record.overtime_hours?.toString() || "",
      notes: record.notes || "",
      is_present: record.is_present,
      is_absent: record.is_absent,
      is_late: record.is_late,
      on_leave: record.on_leave,
      is_undertime: record.is_undertime,
      is_halfday: record.is_halfday,
      is_dayoff: record.is_dayoff,
      is_regular_holiday: record.is_regular_holiday,
      is_special_holiday: record.is_special_holiday,
      leave_type_id: record.leave_type_id?.toString() || "",
      leave_request_id: record.leave_request_id?.toString() || "",
    });

    setEditModalOpen(true);
  };

  const handleCloseModals = () => {
    setViewModalOpen(false);
    setEditModalOpen(false);
    setSelectedRecord(null);
    // Reset form
    setEditForm({
      date: "",
      time_in: "",
      time_out: "",
      total_hours: "",
      overtime_hours: "",
      notes: "",
      is_present: false,
      is_absent: false,
      is_late: false,
      on_leave: false,
      is_undertime: false,
      is_halfday: false,
      is_dayoff: false,
      is_regular_holiday: false,
      is_special_holiday: false,
      leave_type_id: "",
      leave_request_id: "",
    });
  };

  const handleUpdateAttendance = async () => {
    if (!selectedRecord) return;

    setIsUpdating(true);
    try {
      const updateData = {
        date: editForm.date || undefined,
        time_in: editForm.time_in || undefined,
        time_out: editForm.time_out || undefined,
        total_hours: editForm.total_hours
          ? parseFloat(editForm.total_hours)
          : undefined,
        overtime_hours: editForm.overtime_hours
          ? parseFloat(editForm.overtime_hours)
          : undefined,
        notes: editForm.notes || undefined,
        is_present: editForm.is_present,
        is_absent: editForm.is_absent,
        is_late: editForm.is_late,
        on_leave: editForm.on_leave,
        is_undertime: editForm.is_undertime,
        is_halfday: editForm.is_halfday,
        is_dayoff: editForm.is_dayoff,
        is_regular_holiday: editForm.is_regular_holiday,
        is_special_holiday: editForm.is_special_holiday,
        leave_type_id: editForm.leave_type_id
          ? parseInt(editForm.leave_type_id)
          : undefined,
        leave_request_id: editForm.leave_request_id
          ? parseInt(editForm.leave_request_id)
          : undefined,
      };

      const response = await axios.put(
        `/attendance/manual-update/${selectedRecord.attendance_id}`,
        updateData
      );

      if (response.data.success) {
        toast.success("Attendance record updated successfully");
        fetchAttendanceRecords(); // Refresh data
        handleCloseModals();
      }
    } catch (error: any) {
      console.error("Error updating attendance:", error);
      toast.error(
        error.response?.data?.message || "Failed to update attendance record"
      );
    } finally {
      setIsUpdating(false);
    }
  };

  // Define columns for the attendance table using the extracted function
  const columns = createAttendanceColumns({
    getStatusBadges,
    handleViewRecord,
    handleEditRecord,
  });

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

      <Modal
        open={viewModalOpen}
        setOpen={setViewModalOpen}
        title="View Attendance Record"
        description=""
      >
        {viewModalContent({ selectedRecord, getStatusBadges })}
      </Modal>

      <Modal
        open={editModalOpen}
        setOpen={setEditModalOpen}
        title=""
        description=""
        className="max-w-3xl max-h-[90vh] overflow-y-auto"
      >
        {editModalContent({
          selectedRecord,
          editForm,
          setEditForm,
          handleUpdateAttendance,
          handleCloseModals,
          isUpdating,
        })}
      </Modal>
    </div>
  );
};

export default RawTimesheet;
