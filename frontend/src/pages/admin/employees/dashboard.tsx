import { EmployeeTable } from "@/components/tables/employee-table";
import { type Employee } from "@/models/employee-model";
import { useEmployees } from "@/hooks/useEmployees";
import { useState } from "react";
import Modal from "@/components/modal";
import { List, LayoutGrid } from "lucide-react";
import employeeColumns from "@/components/tables/columns/employee-columns";
import EmployeeDirectory from "@/components/modal-contents/employee-directory";
import { Button } from "@/components/ui/button";
import EmployeeGrid from "@/components/grids/employee-grid";
import useEmployeeViewStore from "@/store/employeeViewStore";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const EmployeeDashboard = () => {
  const { employees, loading, error } = useEmployees();
  const [isViewEmployeeModalOpen, setIsViewEmployeeModalOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(
    null
  );
  const { isTableView, setIsTableView } = useEmployeeViewStore();
  const [isEditing, setIsEditing] = useState(false);

  const columns = employeeColumns(
    setIsViewEmployeeModalOpen,
    setIsEditing,
    (employee) => {
      setSelectedEmployee(employee);
      setIsViewEmployeeModalOpen(true);
    }
  );

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
        className="sm:max-w-[calc(100%-4rem)] h-9/10 flex flex-col overflow-auto"
      >
        <EmployeeDirectory
          employee={selectedEmployee}
          isReadOnly={!isEditing}
        />
      </Modal>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="outline"
            className="mb-4"
            size={"icon"}
            onClick={() => setIsTableView(!isTableView)}
          >
            {isTableView ? <LayoutGrid /> : <List />}
          </Button>
        </TooltipTrigger>
        <TooltipContent side="right">
          Switch to {isTableView ? "Card" : "Table"} View
        </TooltipContent>
      </Tooltip>

      <div className="space-y-4">
        {isTableView ? (
          <EmployeeTable<Employee, any> columns={columns} data={employees} />
        ) : (
          <EmployeeGrid
            employees={employees}
            setSelectedEmployee={setSelectedEmployee}
            setIsViewEmployeeModalOpen={setIsViewEmployeeModalOpen}
            setIsEditing={setIsEditing}
          />
        )}
      </div>
    </>
  );
};

export default EmployeeDashboard;
