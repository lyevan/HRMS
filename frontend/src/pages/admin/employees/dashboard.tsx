import { EmployeeTable } from "@/components/tables/employee-table";
import { type Employee } from "@/models/employee-model";
import { useEmployees } from "@/hooks/useEmployees";
import { useState } from "react";
import Modal from "@/components/modal";
import employeeColumns from "@/components/tables/columns/employee-columns";
import EmployeeDirectory from "@/components/modal-contents/employee-directory";

const EmployeeDashboard = () => {
  const { employees, loading, error } = useEmployees();
  const [isViewEmployeeModalOpen, setIsViewEmployeeModalOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(
    null
  );

  const columns = employeeColumns(setIsViewEmployeeModalOpen, (employee) => {
    setSelectedEmployee(employee);
    setIsViewEmployeeModalOpen(true);
  });

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
        <div className="text-red-500">Error: {error}</div>
      </div>
    );
  }

  return (
    <>
      <Modal
        open={isViewEmployeeModalOpen}
        setOpen={setIsViewEmployeeModalOpen}
        title={"Employee Directory"}
        description=""
        className="w-full"
      >
        <EmployeeDirectory employee={selectedEmployee} />
      </Modal>
      <div className="space-y-4">
        <EmployeeTable<Employee, any> columns={columns} data={employees} />
      </div>
    </>
  );
};

export default EmployeeDashboard;
