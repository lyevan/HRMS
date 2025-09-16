import { EmployeeTable } from "@/components/tables/employee-table";
import { type Employee } from "@/models/employee-model";
import {
  useEmployees,
  useFetchEmployees,
  useEmployeeLoading,
  useEmployeeError,
  useEmployeeStore,
} from "@/store/employeeStore";
import { useEffect, useState } from "react";
import Modal from "@/components/modal";
import { List, LayoutGrid, Download } from "lucide-react";
import employeeColumns from "@/components/tables/columns/employee-columns";
import EmployeeDirectory from "@/components/modal-contents/employee-directory";
import { Button } from "@/components/ui/button";
import EmployeeGrid from "@/components/grids/employee-grid";
import useEmployeeViewStore from "@/store/employeeViewStore";
import { exportEmployeesToExcel } from "@/utils/excel-export";
import { toast } from "sonner";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import AddEmployeeForm from "@/components/forms/add-employee-form";
import { useBulkDelete } from "@/hooks/use-bulk-delete";

const EmployeeDashboard = () => {
  const employees = useEmployees();
  const loading = useEmployeeLoading();
  const error = useEmployeeError();
  const fetchEmployees = useFetchEmployees();
  const { bulkDeleteEmployees } = useEmployeeStore();

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
  const [enableBulkSelect, setEnableBulkSelect] = useState(false);

  // Bulk delete functionality
  const bulkDelete = useBulkDelete<Employee>({
    onDelete: bulkDeleteEmployees,
    getItemId: (employee) => employee.employee_id,
    getItemName: (employee) => `${employee.first_name} ${employee.last_name}`,
    itemTypeName: "employees",
  });

  const columns = employeeColumns({
    setIsModalOpen: setIsViewEmployeeModalOpen,
    setIsEditing,
    onViewEmployee: (employee: Employee) => {
      setSelectedEmployee(employee);
      setIsViewEmployeeModalOpen(true);
    },
    // Bulk select props
    isItemSelected: enableBulkSelect ? bulkDelete.isItemSelected : undefined,
    toggleItemSelection: enableBulkSelect
      ? bulkDelete.toggleItemSelection
      : undefined,
    toggleAllItems: enableBulkSelect ? bulkDelete.toggleAllItems : undefined,
    allItems: enableBulkSelect ? employees : undefined,
    enableBulkSelect,
  });

  // Handle Excel export
  const handleExportToExcel = async () => {
    try {
      if (employees.length === 0) {
        toast.error("No employees to export");
        return;
      }

      await exportEmployeesToExcel(employees, "Employee Directory");

      toast.success("Employee data exported successfully!");
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Failed to export employee data");
    }
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
      <div className="flex items-center gap-2 mb-4">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              // variant="primary"
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

        {isTableView && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={enableBulkSelect ? "default" : "outline"}
                onClick={() => {
                  setEnableBulkSelect(!enableBulkSelect);
                  if (enableBulkSelect) {
                    bulkDelete.clearSelection();
                  }
                }}
              >
                {enableBulkSelect ? "Exit" : "Bulk"} Select
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">
              {enableBulkSelect
                ? "Exit bulk selection mode"
                : "Enable bulk selection for deletion"}
            </TooltipContent>
          </Tooltip>
        )}

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              onClick={handleExportToExcel}
              disabled={loading || employees.length === 0}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Export Excel
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right">
            Export employee data to Excel
          </TooltipContent>
        </Tooltip>
      </div>

      <div className="space-y-4">
        {isTableView ? (
          <EmployeeTable<Employee, any>
            columns={columns}
            data={employees}
            setIsAddEmployeeModalOpen={setIsAddEmployeeModalOpen}
            onBulkDelete={bulkDeleteEmployees}
            enableBulkSelect={enableBulkSelect}
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
