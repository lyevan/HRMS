import Modal from "@/components/modal";
import { ManageSchedulesContent } from "@/components/modal-contents/manage-schedules-content";

interface ManageSchedulesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ManageSchedulesModal({
  isOpen,
  onClose,
}: ManageSchedulesModalProps) {
  return (
    <Modal
      open={isOpen}
      setOpen={onClose}
      title="Manage Schedules"
      description="Create, edit, and delete work schedules"
      className="sm:max-w-4xl max-h-[90vh] flex flex-col overflow-auto"
    >
      <ManageSchedulesContent />
    </Modal>
  );
}
