import { type Employee } from "@/models/employee-model";

interface EmployeeDirectoryProps {
  employee: Employee | null;
}

const EmployeeDirectory = ({ employee }: EmployeeDirectoryProps) => {
  return (
    <div>
      <h2>Employee Directory</h2>
      {employee ? (
        <div>
          <p>ID: {employee.employee_id}</p>
          <p>
            Name: {employee.first_name} {employee.last_name}
          </p>
          <p>Email: {employee.email}</p>
          <p>Department: {employee.department_name}</p>
          <p>Position: {employee.position_title}</p>
          <p>Status: {employee.status}</p>
          <p>Rate Type: {employee.rate_type}</p>
          <p>Salary: {employee.salary_rate}</p>
        </div>
      ) : (
        <p>No employee selected</p>
      )}
    </div>
  );
};

export default EmployeeDirectory;
