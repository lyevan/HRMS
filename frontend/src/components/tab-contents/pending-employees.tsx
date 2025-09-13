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
import AddEmployeeForm from "../forms/add-employee-form";

const PendingEmployees = () => {
  const [isAddEmployeeModalOpen, setIsAddEmployeeModalOpen] = useState(false);
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
    // console.log("🔍 PendingEmployees: Fetching pending employees...");
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

      {/* Add Employee Modal */}
      <Modal
        open={isAddEmployeeModalOpen}
        setOpen={setIsAddEmployeeModalOpen}
        title={"Send Onboarding Form"}
        className="sm:max-w-[calc(50%-4rem)] h-fit max-h-9/10 flex flex-col overflow-auto"
        description="Send an onboarding form to the new employee with the email they have provided."
      >
        <AddEmployeeForm setOpen={setIsAddEmployeeModalOpen} />
      </Modal>

      <div>
        <PendingEmployeeTable<PendingEmployee, any>
          setIsAddEmployeeModalOpen={setIsAddEmployeeModalOpen}
          columns={columns}
          data={pendingEmployees}
        />
      </div>
    </>
  );
};

export default PendingEmployees;
