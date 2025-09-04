import { useEffect, useState } from "react";
import pendingEmployeeColumns from "../tables/columns/pending-columns";
import { PendingEmployeeTable } from "../tables/pending-table";
import {
  usePendingEmployees,
  useFetchPendingEmployees,
} from "@/store/pendingEmployeeStore";
import { type PendingEmployee } from "@/models/pending-employee-model";
import Modal from "../modal";
import PendingEmployeeDirectory from "../modal-contents/pending-employee-directory";

const PendingEmployees = () => {
  const [isViewPendingEmployeeModalOpen, setIsViewPendingEmployeeModalOpen] =
    useState(false);
  const [selectedPendingEmployee, setSelectedPendingEmployee] =
    useState<PendingEmployee | null>(null);

  const pendingEmployees = usePendingEmployees();
  const fetchPendingEmployees = useFetchPendingEmployees();

  const handleViewDetails = (employee: PendingEmployee) => {
    setSelectedPendingEmployee(employee);
  };

  const columns = pendingEmployeeColumns(
    setIsViewPendingEmployeeModalOpen,
    handleViewDetails
  );

  useEffect(() => {
    console.log("🔍 PendingEmployees: Fetching pending employees...");
    fetchPendingEmployees();
  }, [fetchPendingEmployees]);

  return (
    <>
      {/* Pending Employee Directory Modal */}
      <Modal
        open={isViewPendingEmployeeModalOpen}
        setOpen={setIsViewPendingEmployeeModalOpen}
        title={"Pending Employee Directory"}
        description=""
        className="sm:max-w-[calc(100%-4rem)] h-9/10 flex flex-col overflow-auto"
      >
        <PendingEmployeeDirectory
          employee={selectedPendingEmployee}
          isReadOnly={true}
        />
      </Modal>

      <div>
        <PendingEmployeeTable<PendingEmployee, any>
          columns={columns}
          data={pendingEmployees}
        />
      </div>
    </>
  );
};

export default PendingEmployees;
