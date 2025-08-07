import React, { useState, useEffect } from "react";
import axios from "axios";
import { RefreshCcw } from "lucide-react";
const DashCardSmall = ({ name, value, className = "" }) => {
  return (
    <div
      className={`card flex flex-col bg-primary w-full text-primary-content card-xs p-2 lg:w-72 ${className}`}
    >
      <section className="text-xs lg:text-base w-full">{name}</section>
      <section className="text-2xl lg:text-4xl font-bold">{value}</section>
    </div>
  );
};

const AdminHome = () => {
  const [employeeData, setEmployeeData] = useState({});
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    const fetchEmployeeData = async () => {
      try {
        const result = await axios.get("/employees");

        const employeeCount = result.data.data.length;
        setEmployeeData({ ...employeeData, employeeCount });

        console.log(employeeCount);
      } catch (error) {
        console.log(error.message);
      }
    };
    fetchEmployeeData();
  }, [isRefreshing]);

  return (
    <div className="">
      <button
        className="btn btn-primary"
        onClick={() => setIsRefreshing(!isRefreshing)}
      >
        <RefreshCcw />
      </button>{" "}
      {/* Dashboard Number Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-2 mt-4 place-items-center">
        <DashCardSmall
          name={"Total Employees"}
          value={employeeData.employeeCount}
        />
        <DashCardSmall name={"Job Applicants"} value={23} />
        <DashCardSmall
          className="col-span-2 lg:col-span-1"
          name={"Total Payroll"}
          value={"₱153,055.50"}
        />
      </div>
    </div>
  );
};

export default AdminHome;
