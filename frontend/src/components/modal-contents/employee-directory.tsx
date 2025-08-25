import { type Employee } from "@/models/employee-model";

interface EmployeeDirectoryProps {
  employee: Employee | null;
}

const EmployeeDirectory = ({ employee }: EmployeeDirectoryProps) => {
  return (
    <div>
      {employee ? (
        <div>
          {employee.avatar_url ? (
            <img src={employee.avatar_url} alt="Employee Avatar" />
          ) : (
            <div className="h-20 w-20 bg-card border border-foreground text-foreground flex items-center justify-center text-2xl rounded-full">
              {employee.first_name.charAt(0)}
              {employee.last_name.charAt(0)}
            </div>
          )}

          <p>ID: {employee.employee_id}</p>
          <p>
            Name: {employee.first_name} {employee.last_name}
          </p>
          <p>Email: {employee.email}</p>
          <p>Phone: {employee.phone || "0999-123-4567"} </p>
          <p>Department: {employee.department_name}</p>
          <p>Position: {employee.position_title}</p>
          <p>Status: {employee.status}</p>
          <p>
            Hired Date:{" "}
            {new Date(employee.contract_start_date).toLocaleDateString()}
          </p>
          <p>
            End of Contract Date:{" "}
            {employee.contract_end_date
              ? new Date(employee.contract_end_date).toLocaleDateString()
              : "N/A"}
          </p>
          <p>Employement Type: {employee.employment_type}</p>
          <p>Rate Type: {employee.rate_type}</p>
          <p>Salary: {employee.salary_rate}</p>

          <ul>
            <p>Leaves:</p>
            {employee.leave_balances.map((leave) => (
              <li className="ml-4" key={leave.leave_type}>
                {leave.leave_type}: {leave.balance} days
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p>No employee selected</p>
      )}
    </div>
  );
};

export default EmployeeDirectory;
