import { ProcessTimesheetTable } from "@/components/tables/process-timesheet-table";
import { createProcessTimesheetColumns } from "@/components/tables/columns/process-timesheet-columns";
import { useAttendanceStore } from "@/store/attendanceStore";
import { useEffect } from "react";
import { getStatusBadges } from "@/lib/badge-config";
import type { AttendanceRecord } from "@/models/attendance-model";
import { useState } from "react";

const ProcessingTimesheet = () => {
  const [selectedRows, setSelectedRows] = useState<AttendanceRecord[]>([]);

  const { attendanceRecords, loading, error, fetchAttendanceRecords } =
    useAttendanceStore();

  useEffect(() => {
    fetchAttendanceRecords();
  }, [fetchAttendanceRecords]);

  const columns = createProcessTimesheetColumns({
    getStatusBadges,
  });

  return (
    <div>
      <ProcessTimesheetTable
        columns={columns}
        loading={loading}
        error={error}
        data={attendanceRecords}
        selectedRecords={selectedRows}
        onSelectionChange={setSelectedRows}
      />
    </div>
  );
};

export default ProcessingTimesheet;
