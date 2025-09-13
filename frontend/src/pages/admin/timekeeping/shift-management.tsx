import { SchedAssignTable } from "@/components/tables/sched-assign-table";
import schedAssignColumns from "@/components/tables/columns/sched-assign-columns";
import { SchedulesList } from "@/components/schedules/schedules-list";
import { BulkAssignConfirmModal } from "@/components/modals/bulk-assign-confirm-modal";
import { ManageSchedulesModal } from "@/components/modals/manage-schedules-modal";
import {
  useEmployees,
  useEmployeeLoading,
  useEmployeeError,
  useFetchEmployees,
} from "@/store/employeeStore";
import { useAssignScheduleBulk } from "@/store/schedulesStore";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { type Employee } from "@/models/employee-model";
import { type Schedule } from "@/models/schedules-model";
import { toast } from "sonner";

const ShiftManagement = () => {
  const employees = useEmployees();
  const loading = useEmployeeLoading();
  const error = useEmployeeError();
  const fetchEmployees = useFetchEmployees();
  const assignScheduleBulk = useAssignScheduleBulk();

  // State for bulk assignment
  const [selectedEmployees, setSelectedEmployees] = useState<Employee[]>([]);
  const [selectedSchedule, setSelectedSchedule] = useState<Schedule | null>(
    null
  );
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);
  const [isManageSchedulesModalOpen, setIsManageSchedulesModalOpen] =
    useState(false);

  useEffect(() => {
    fetchEmployees();
  }, []); // Empty dependency array - only run once on mount

  const handleBulkAssign = () => {
    if (selectedEmployees.length === 0) {
      toast.warning("Please select at least one employee");
      return;
    }
    if (!selectedSchedule) {
      toast.warning("Please select a schedule");
      return;
    }
    setIsConfirmModalOpen(true);
  };

  const handleConfirmBulkAssign = async () => {
    if (!selectedSchedule) return;

    setIsAssigning(true);
    try {
      await assignScheduleBulk({
        employee_ids: selectedEmployees.map((emp) => emp.employee_id),
        schedule_id: selectedSchedule.schedule_id,
      });

      // Success - close modal and reset selections
      setIsConfirmModalOpen(false);
      setSelectedEmployees([]);
      setSelectedSchedule(null);

      // Show success toast
      toast.success(
        `Successfully assigned ${selectedEmployees.length} employee${
          selectedEmployees.length !== 1 ? "s" : ""
        } to ${selectedSchedule.schedule_name}`
      );
    } catch (error) {
      console.error("Bulk assignment error:", error);
      // Show error toast
      toast.error(
        `Failed to assign schedules: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    } finally {
      setIsAssigning(false);
    }
  };

  const handleManageSchedules = () => {
    setIsManageSchedulesModalOpen(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <span className="ml-2">Loading employees...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <span className="text-red-500">Error loading employees: {error}</span>
      </div>
    );
  }

  return (
    <div className="space-y-6h-fit">
      <div className="grid grid-cols-12 gap-6">
        {/* Left side - Employee Table */}
        <div className="col-span-7 row-span-1 h-[calc(70vh-4.5rem)]">
          <div className="bg-card rounded-lg border p-4 h-full">
            <h2 className="text-lg font-semibold mb-4">Select Employees</h2>
            <SchedAssignTable
              columns={schedAssignColumns}
              data={employees}
              selectedEmployees={selectedEmployees}
              onSelectionChange={setSelectedEmployees}
            />
          </div>
        </div>

        {/* Middle - Bulk Assign Button */}
        <div className="col-span-2 row-span-1 h-[calc(70vh-4.5rem)] flex items-center justify-center">
          <div className="text-center space-y-4">
            <Button
              onClick={handleBulkAssign}
              disabled={selectedEmployees.length === 0 || !selectedSchedule}
              size="lg"
              className="w-full"
            >
              <ArrowRight className="w-4 h-4 mr-2" />
              Bulk Assign
            </Button>
            <div className="text-xs text-muted-foreground">
              {selectedEmployees.length} employees →{" "}
              {selectedSchedule?.schedule_name || "No schedule"}
            </div>
          </div>
        </div>

        {/* Right side - Schedules List */}
        <div className="col-span-3 row-span-1 h-[calc(70vh-4.5rem)]">
          <div className="bg-card rounded-lg border p-4 h-full overflow-auto">
            <h2 className="text-lg font-semibold mb-4">Select Schedule</h2>
            <SchedulesList
              selectedSchedule={selectedSchedule}
              onScheduleSelect={setSelectedSchedule}
              onManageSchedules={handleManageSchedules}
            />
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {selectedSchedule && (
        <BulkAssignConfirmModal
          isOpen={isConfirmModalOpen}
          onClose={() => setIsConfirmModalOpen(false)}
          onConfirm={handleConfirmBulkAssign}
          selectedEmployees={selectedEmployees}
          selectedSchedule={selectedSchedule}
          isLoading={isAssigning}
        />
      )}

      {/* Manage Schedules Modal */}
      <ManageSchedulesModal
        isOpen={isManageSchedulesModalOpen}
        onClose={() => setIsManageSchedulesModalOpen(false)}
      />
    </div>
  );
};

export default ShiftManagement;
