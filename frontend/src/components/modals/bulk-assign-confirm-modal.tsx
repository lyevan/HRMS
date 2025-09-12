import Modal from "@/components/modal";
import { BulkAssignConfirmContent } from "@/components/modal-contents/bulk-assign-confirm-content";
import { type Employee } from "@/models/employee-model";
import { type Schedule } from "@/models/schedules-model";

interface BulkAssignConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  selectedEmployees: Employee[];
  selectedSchedule: Schedule;
  isLoading?: boolean;
}

export function BulkAssignConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  selectedEmployees,
  selectedSchedule,
  isLoading = false,
}: BulkAssignConfirmModalProps) {
  return (
    <Modal
      open={isOpen}
      setOpen={onClose}
      title="Confirm Bulk Schedule Assignment"
      description={`Assign ${selectedEmployees.length} employee${
        selectedEmployees.length !== 1 ? "s" : ""
      } to ${selectedSchedule.schedule_name}`}
      className="sm:max-w-2xl max-h-[80vh] flex flex-col overflow-auto"
    >
      <BulkAssignConfirmContent
        onConfirm={onConfirm}
        selectedEmployees={selectedEmployees}
        selectedSchedule={selectedSchedule}
        isLoading={isLoading}
      />
    </Modal>
  );
}
