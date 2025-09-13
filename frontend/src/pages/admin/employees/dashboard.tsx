import { EmployeeTable } from "@/components/tables/employee-table";
import { type Employee } from "@/models/employee-model";
import {
  useEmployees,
  useFetchEmployees,
  useEmployeeLoading,
  useEmployeeError,
} from "@/store/employeeStore";
import { useEffect, useState } from "react";
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
import AddEmployeeForm from "@/components/forms/add-employee-form";

const EmployeeDashboard = () => {
  const employees = useEmployees();
  const loading = useEmployeeLoading();
  const error = useEmployeeError();
  const fetchEmployees = useFetchEmployees();

  useEffect(() => {
    // console.log("🔍 Dashboard: Fetching employees...");
    fetchEmployees();
  }, [fetchEmployees]);

  const [isViewEmployeeModalOpen, setIsViewEmployeeModalOpen] = useState(false);
  const [isAddEmployeeModalOpen, setIsAddEmployeeModalOpen] = useState(false);
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
      {/* Employee Directory Modal */}
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
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            // variant="primary"
            className="mb-4"
            onClick={() => setIsTableView(!isTableView)}
          >
            {isTableView ? <LayoutGrid /> : <List />}
            Change View
          </Button>
        </TooltipTrigger>
        <TooltipContent side="right">
          Switch to {isTableView ? "Card" : "Table"} View
        </TooltipContent>
      </Tooltip>

      <div className="space-y-4">
        {isTableView ? (
          <EmployeeTable<Employee, any>
            columns={columns}
            data={employees}
            setIsAddEmployeeModalOpen={setIsAddEmployeeModalOpen}
          />
        ) : (
          <EmployeeGrid
            employees={employees}
            setIsAddEmployeeModalOpen={setIsAddEmployeeModalOpen}
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
