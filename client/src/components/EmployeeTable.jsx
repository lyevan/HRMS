import { useState, useEffect } from "react";
import axios from "axios";
import RefreshButton from "./RefreshButton";
import {
  UserCircle2,
  ShieldCheck,
  ShieldAlert,
  Info,
  SquarePen,
} from "lucide-react";
import RFIDModal from "./RFIDModal";
import Toast from "./Toast";
import LoadingSpinner from "./LoadingSpinner";

const PersonalInfo = ({ employee }) => {
  return (
    <div className="flex flex-row items-center gap-2">
      <div className="hidden sm:block">
        {employee.avatar ? (
          <img
            src={employee.avatar}
            alt="Avatar"
            className="w-8 h-8 rounded-full"
          />
        ) : (
          <UserCircle2 className="w-8 h-8" />
        )}
      </div>
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

const RFIDBadge = ({ rfid, clickHandler }) => {
  if (!rfid)
    return (
      <button className="btn" onClick={clickHandler}>
        <ShieldAlert className="w-6 h-6 text-warning" />
      </button>
    );
  return (
    <button className="btn" onClick={clickHandler}>
      <ShieldCheck className="w-6 h-6 text-success" />
    </button>
  );
};

const EmployeeTable = () => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [employeeData, setEmployeeData] = useState([]);
  const [isRFIDModalOpen, setIsRFIDModalOpen] = useState(false);
  const [activeEmployee, setActiveEmployee] = useState({});

  useEffect(() => {
    setIsRefreshing(!isRefreshing);
  }, [isRFIDModalOpen]);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const result = await axios.get("/employees");
        setEmployeeData(result.data.data);
      } catch (error) {
        console.error("Error fetching employee data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [isRefreshing]);

  const handleMoreInfo = (employee) => {
    console.log("More info for employee:", employee.employee_id);
  };

  return (
    <div className="w-full">
      <div className="flex justify-end items-center mb-4 gap-4">
        <RefreshButton
          isRefreshing={isRefreshing}
          setIsRefreshing={setIsRefreshing}
        />
      </div>
      <RFIDModal
        employee={activeEmployee}
        isModalOpen={isRFIDModalOpen}
        setIsModalOpen={setIsRFIDModalOpen}
      />

      <Toast />

      <div className="overflow-x-hidden sm:overflow-x-auto">
        <table className="table table-xs table-pin-rows table-pin-cols">
          <thead>
            <tr>
              <th className="bg-base-200 border-b border-base-300 text-center">
                ID
              </th>
              <th className="bg-base-200">Personal Info</th>
              <th className="bg-base-200 text-center">Enrolled</th>
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
            {isLoading ? (
              <tr className="">
                <td colSpan="7" className="text-center h-120">
                  <LoadingSpinner />
                </td>
              </tr>
            ) : (
              employeeData?.map((employee) => (
                <tr key={employee.employee_id}>
                  <th className="bg-base-200 border-b border-base-300 text-center">
                    {employee.employee_id}
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
                  <td className="flex justify-center items-center pt-2">
                    {
                      <RFIDBadge
                        rfid={employee.rfid}
                        clickHandler={() => {
                          setActiveEmployee(employee);
                          setIsRFIDModalOpen(true);
                        }}
                      />
                    }
                  </td>
                  <td className="hidden sm:table-cell">{employee.position}</td>
                  <td className="hidden md:table-cell">
                    {employee.department}
                  </td>
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
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default EmployeeTable;
