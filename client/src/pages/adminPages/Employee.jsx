import React from "react";
import EmployeeTable from "../../components/EmployeeTable";
import PendingEmployeeTable from "../../components/PendingEmployeeTable";

const Employee = () => {
  return (
    <div>
      <EmployeeTable />
      <PendingEmployeeTable />
    </div>
  );
};

export default Employee;
