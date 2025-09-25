import { useEffect, useState } from "react";
import { useAttendanceStore } from "@/store/attendanceStore";
import { AttendanceTable } from "@/components/tables/attendance-table";
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import { Button } from "@/components/ui/button";
// import { Download } from "lucide-react";
import { toast } from "sonner";
import type { AttendanceRecord } from "@/models/attendance-model";
import { viewModalContent } from "@/components/modal-contents/view-attendance-modal";
import { editModalContent } from "@/components/modal-contents/edit-attendance-modal";
import { createAttendanceColumns } from "@/components/tables/columns/attendance-columns";
import { getStatusBadges } from "@/lib/badge-config";
// import { exportTimesheetToExcel } from "@/utils/excel-export";
import axios from "axios";
import Modal from "@/components/modal";
import { deleteAttendanceRecord } from "@/models/attendance-model";

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
    time_in: "",
    time_out: "",
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
    const formatTime = (dateTime: string | null) => {
      if (!dateTime) return "";
      // Convert UTC timestamp to Manila time for display
      const utcDate = new Date(dateTime);
      const manilaTime = new Date(utcDate.getTime() + 8 * 60 * 60 * 1000); // Add 8 hours for Manila
      return manilaTime.toISOString().slice(11, 16); // Extract HH:MM
    };

    setEditForm({
      time_in: formatTime(record.time_in),
      time_out: formatTime(record.time_out),
    });

    setEditModalOpen(true);
  };

  const handleDeleteRecord = async (record: AttendanceRecord) => {
    if (
      !confirm(
        `Are you sure you want to delete the attendance record for ${record.first_name} ${record.last_name} on ${record.date}?`
      )
    ) {
      return;
    }

    try {
      await deleteAttendanceRecord(record.attendance_id);
      toast.success("Attendance record deleted successfully");
      fetchAttendanceRecords(true); // Refresh data
    } catch (error: any) {
      console.error("Error deleting attendance:", error);
      toast.error(
        error.response?.data?.message || "Failed to delete attendance record"
      );
    }
  };

  const handleCloseModals = () => {
    setViewModalOpen(false);
    setEditModalOpen(false);
    setSelectedRecord(null);
    // Reset form
    setEditForm({
      time_in: "",
      time_out: "",
    });
  };

  const handleUpdateAttendance = async () => {
    if (!selectedRecord) return;

    // Validate required fields
    if (!editForm.time_in || !editForm.time_out) {
      alert("Both Time In and Time Out are required");
      return;
    }

    // Combine date with times to create full datetime strings
    // Convert Manila time inputs to UTC (same as manual log request)
    // Convert Some dates like this recordDate: 2025-09-30T16:00:00.000Z to YYYY-MM-DD
    const recordDate = selectedRecord.date.split("T")[0];
    console.log("recordDate:", recordDate);
    console.log("editForm.time_in:", editForm.time_in);
    console.log("editForm.time_out:", editForm.time_out);

    const convertManilaTimeToUTC = (
      date: string,
      timeIn: string,
      timeOut: string
    ): { timeInUTC: string; timeOutUTC: string } => {
      let timeInDate = new Date(`${date}T${timeIn}+08:00`);
      let timeOutDate = new Date(`${date}T${timeOut}+08:00`);

      // If time_out is earlier than time_in, add +1 day
      if (timeOutDate <= timeInDate) {
        timeOutDate.setUTCDate(timeOutDate.getUTCDate() + 1);
      }

      return {
        timeInUTC: timeInDate.toISOString(),
        timeOutUTC: timeOutDate.toISOString(),
      };
    };

    const timeInISOString = convertManilaTimeToUTC(
      recordDate,
      editForm.time_in,
      editForm.time_out
    ).timeInUTC;
    let timeOutISOString = convertManilaTimeToUTC(
      recordDate,
      editForm.time_in,
      editForm.time_out
    ).timeOutUTC;

    // Handle next day time_out (for night shifts)

    // Validate time difference
    const timeDiffHours =
      (new Date(timeOutISOString).getTime() -
        new Date(timeInISOString).getTime()) /
      (1000 * 60 * 60);

    if (timeDiffHours >= 20) {
      alert("Time difference cannot be 20 hours or more");
      return;
    }

    if (timeDiffHours <= 0) {
      alert("Time Out must be after Time In");
      return;
    }

    setIsUpdating(true);
    try {
      const updateData = {
        time_in: timeInISOString,
        time_out: timeOutISOString,
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
    handleDeleteRecord,
  });

  // Handle Excel export
  // const handleExportToExcel = async () => {
  //   try {
  //     if (attendanceRecords.length === 0) {
  //       toast.error("No data to export");
  //       return;
  //     }

  //     await exportTimesheetToExcel(attendanceRecords, "Raw Attendance Records");

  //     toast.success("Data exported successfully!");
  //   } catch (error) {
  //     console.error("Export error:", error);
  //     toast.error("Failed to export data");
  //   }
  // };

  return (
    <div className="p-0">
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

      {/* <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle>Attendance Records</CardTitle>
              <p className="text-sm text-muted-foreground">
                Complete attendance history with filtering and search
                capabilities
              </p>
            </div>
            <Button
              onClick={handleExportToExcel}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
              disabled={loading || attendanceRecords.length === 0}
            >
              <Download className="h-4 w-4" />
              Export Excel
            </Button>
          </div>
        </CardHeader> */}

      <AttendanceTable
        columns={columns}
        data={attendanceRecords}
        loading={loading}
        error={error}
      />

      <Modal
        open={viewModalOpen}
        setOpen={setViewModalOpen}
        title="View Attendance Record"
        description=""
        className="sm:max-w-6xl max-h-[90vh] overflow-y-auto"
      >
        {viewModalContent({ selectedRecord, getStatusBadges })}
      </Modal>

      <Modal
        open={editModalOpen}
        setOpen={setEditModalOpen}
        title=""
        description=""
        className="sm:max-w-6xl max-h-[90vh] overflow-y-auto"
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
