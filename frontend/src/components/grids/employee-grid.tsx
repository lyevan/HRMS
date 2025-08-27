import EmployeeCard from "../employee-card";
import { type Employee } from "@/models/employee-model";

interface EmployeeGridProps {
  employees: Employee[];
  setIsViewEmployeeModalOpen?: (isOpen: boolean) => void;
  setSelectedEmployee?: (employee: Employee | null) => void;
  setIsEditing?: (isEditing: boolean) => void;
}

const EmployeeGrid = ({
  employees,
  setIsViewEmployeeModalOpen,
  setSelectedEmployee,
  setIsEditing,
}: EmployeeGridProps) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 gap-4">
      {employees.map((employee) => (
        <EmployeeCard
          key={employee.employee_id}
          employee={employee}
          setIsViewEmployeeModalOpen={setIsViewEmployeeModalOpen}
          setSelectedEmployee={setSelectedEmployee}
          setIsEditing={setIsEditing}
        />
      ))}
    </div>
  );
};

export default EmployeeGrid;
