import React from "react";
import EmployeeTable from "../../components/EmployeeTable";
import PendingEmployeeTable from "../../components/PendingEmployeeTable";

const Employee = () => {
  return (
    <div>
      <div className="tabs tabs-lift">
        <input
          type="radio"
          name="my_tabs_3"
          className="tab"
          aria-label="Current"
          defaultChecked
        />
        <div className="tab-content bg-base-100 border-base-300 p-2">
          <EmployeeTable />
        </div>

        <input
          type="radio"
          name="my_tabs_3"
          className="tab"
          aria-label="Pending"
        />
        <div className="tab-content bg-base-100 border-base-300 p-2">
          <PendingEmployeeTable />
        </div>

        <input
          type="radio"
          name="my_tabs_3"
          className="tab"
          aria-label="Tab 3"
        />
        <div className="tab-content bg-base-100 border-base-300 p-2">
          Tab content 3
        </div>
      </div>
    </div>
  );
};

export default Employee;
