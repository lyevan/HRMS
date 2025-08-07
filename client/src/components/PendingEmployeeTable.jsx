import { useState, useEffect } from "react";
import axios from "axios";
import RefreshButton from "./RefreshButton";
import {
  UserCircle2,
  ShieldCheck,
  ShieldAlert,
  Info,
  SquarePen,
  UserPlus,
} from "lucide-react";
import Toast from "./Toast";
import useToastStore from "../store/toastStore";

const PersonalInfo = ({ employee }) => {
  return (
    <div className="flex flex-row items-center gap-2">
      <div>
        <div className="flex flex-row items-center gap-1">
          <p className="font-bold text-[0.75rem] mb-[0.2rem] sm:font-normal sm:text-xs">{`${employee.first_name} ${employee.last_name}`}</p>
          <div className="sm:hidden bg-success w-2 h-2 rounded-full"> </div>
        </div>
        <p className="text-[0.6rem] text-neutral">{employee.email}</p>
        <p className="text-[0.6rem] text-neutral">{employee.phone}</p>
      </div>
    </div>
  );
};

const PendingEmployeeTable = () => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [employeeData, setEmployeeData] = useState([]);
  const [activeEmployee, setActiveEmployee] = useState({});



  useEffect(() => {
    const fetchData = async () => {
      // Fetch employee data from API
      const result = await axios.get("/invite/pending");
      setEmployeeData(result.data.result);
    };

    fetchData();
  }, [isRefreshing]);

  const handleMoreInfo = (employee) => {
    console.log("More info for employee:", employee.email);
  };

  return (
    <div>
      <div className="flex justify-end items-center mb-4 gap-4">
        <RefreshButton
          isRefreshing={isRefreshing}
          setIsRefreshing={setIsRefreshing}
        />
      </div>

      <div className="overflow-x-hidden sm:overflow-x-auto">
        <table className="table table-xs table-pin-rows table-pin-cols">
          <thead>
            <tr>
              <th className="bg-base-200 border-b border-base-300 text-center">
                ID
              </th>
              <th className="bg-base-200">Personal Info</th>
            
              <th className="bg-base-200 hidden sm:table-cell">Position</th>
              <th className="bg-base-200 hidden md:table-cell">Department</th>
              <th className="bg-base-200 hidden lg:table-cell text-center">
                Status
              </th>
              <th className="bg-base-200 hidden sm:table-cell text-center">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {employeeData?.map((employee) => (
              <tr key={employee.id}>
                <th className="bg-base-200 border-b border-base-300 text-center">
                  {employee.id}
                </th>
                <td className="relative">
                  <button
                    className="absolute inset-0 sm:hidden"
                    onClick={() => handleMoreInfo(employee)}
                  ></button>
                  <PersonalInfo employee={employee} />
                  <dl className="sm:hidden mt-[0.3rem]">
                    <dt className="sr-only">Position</dt>
                    <dd className="text-[0.5rem] text-neutral sm:table-cell">
                      {employee.position}
                    </dd>
                    <dt className="sr-only">Department</dt>
                    <dd className="text-[0.5rem] text-neutral md:table-cell">
                      {employee.department}
                    </dd>
                  </dl>
                </td>
                <td className="hidden sm:table-cell">{employee.position}</td>
                <td className="hidden md:table-cell">{employee.department}</td>
                <td className="hidden lg:table-cell text-center">
                  <div
                    className={`badge font-semibold ${
                      employee.status.toLowerCase() !== "active"
                        ? "badge-warning"
                        : "badge-success"
                    }`}
                  >
                    {employee.status.charAt(0).toUpperCase() +
                      employee.status.slice(1)}
                  </div>
                </td>
                <td className="hidden sm:table-cell text-center space-x-1.5">
                  <div className="tooltip tooltip-left" data-tip="More Info">
                    <button
                      className="text-accent cursor-pointer"
                      onClick={() => handleMoreInfo(employee)}
                    >
                      <Info />
                    </button>
                  </div>
                  <button
                    className="text-warning cursor-pointer"
                    onClick={() => handleMoreInfo(employee)}
                  >
                    <SquarePen />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PendingEmployeeTable;
