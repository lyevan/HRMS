import { useEffect } from "react";
import pendingEmployeeColumns from "../tables/columns/pending-columns";
import { PendingEmployeeTable } from "../tables/pending-table";
import { useEmployees, useFetchEmployees } from "@/store/employeeStore";
import { type Employee } from "@/models/employee-model";

const PendingEmployees = () => {
  const columns = pendingEmployeeColumns();
  const employees = useEmployees();
  const fetchEmployees = useFetchEmployees();

  useEffect(() => {
    fetchEmployees();
  }, []);
  return (
    <div>
      <PendingEmployeeTable<Employee, any> columns={columns} data={employees} />
    </div>
  );
};

export default PendingEmployees;
