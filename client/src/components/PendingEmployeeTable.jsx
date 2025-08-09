import { useState, useEffect } from "react";
import axios from "axios";
import RefreshButton from "./RefreshButton";
import { CheckCircle, UserPlus } from "lucide-react";
import Toast from "./Toast";
import useToastStore from "../store/toastStore";
import { useUserSessionStore } from "../store/userSessionStore";
import ApprovePendingModal from "./forms/ApprovePendingModal";
import LoadingSpinner from "./LoadingSpinner";
import PendingEmployeeForm from "./forms/PendingEmployeeForm";

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
  const [isLoading, setIsLoading] = useState(false);
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [isPendingFormOpen, setIsPendingFormOpen] = useState(false);
  const { showToast } = useToastStore();
  const { user } = useUserSessionStore();

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Fetch employee data from API
        const result = await axios.get("/invite/pending");
        setEmployeeData(result.data.result);
      } catch (error) {
        console.error("Error fetching employee data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [isRefreshing]);

  const handleMoreInfo = (employee) => {
    console.log("More info for employee:", employee.id);
  };

  const handleReviewed = async (employeeId) => {
    try {
      const response = await axios.post(`/invite/review/${employeeId}`);
      console.log("Employee approved:", response.data);
      setIsRefreshing(!isRefreshing);
      showToast("Employee marked as reviewed", "success");
    } catch (error) {
      console.error("Error approving employee:", error);
      showToast(error.response.data.error, "error");
    }
  };

  return (
    <div className="w-full">
      <div className="flex justify-end items-center mb-4 gap-1">
        <button
          className="btn btn-primary btn-sm"
          onClick={() => setIsPendingFormOpen(true)}
          aria-label="Add Pending Employee"
          title="Add Pending Employee"
          disabled={isLoading}
        >
          <UserPlus size={16} />
        </button>
        <RefreshButton
          isRefreshing={isRefreshing}
          setIsRefreshing={setIsRefreshing}
        />
      </div>
      <ApprovePendingModal
        isModalOpen={isRoleModalOpen}
        setIsModalOpen={setIsRoleModalOpen}
        employee={activeEmployee}
      />
      <PendingEmployeeForm
        isModalOpen={isPendingFormOpen}
        setIsModalOpen={setIsPendingFormOpen}
      />

      <div className="overflow-x-hidden sm:overflow-x-auto">
        <table className="table table-xs table-pin-rows table-pin-cols">
          <thead>
            <tr>
              <th className="bg-base-200">Personal Info</th>

              <th className="bg-base-200 hidden sm:table-cell">Position</th>
              <th className="bg-base-200 hidden md:table-cell">Department</th>
              <th className="bg-base-200 text-center">Status</th>
              <th className="bg-base-200 hidden sm:table-cell text-center">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan="7" className="text-center h-120">
                  <LoadingSpinner />
                </td>
              </tr>
            ) : employeeData.length === 0 ? (
              <tr>
                <td colSpan="7" className="text-center h-120">
                  <h1 className="text-lg font-bold">No Pending Employees Found</h1>
                </td>
              </tr>
            ) : (
              employeeData?.map((employee) => (
                <tr key={employee.id}>
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
                  <td className="hidden md:table-cell">
                    {employee.department}
                  </td>
                  <td className="text-center">
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
                  <td className="text-center space-x-1.5">
                    <div
                      className="tooltip tooltip-left tooltip-info"
                      data-tip="Mark as reviewed"
                    >
                      {" "}
                      <button
                        hidden={
                          employee.status.toLowerCase() === "registering" ||
                          employee.status.toLowerCase() === "for approval"
                        }
                        className="text-accent cursor-pointer"
                        onClick={() => handleReviewed(employee.id)}
                      >
                        <CheckCircle />
                      </button>
                    </div>
                    <div
                      className="tooltip tooltip-left tooltip-success"
                      // Only admins can approve pending employees
                      data-tip={
                        user.role === "admin"
                          ? "Mark as approved"
                          : "Not authorized"
                      }
                    >
                      {" "}
                      <button
                        hidden={
                          employee.status.toLowerCase() === "registering" ||
                          employee.status.toLowerCase() === "for reviewing"
                        }
                        disabled={user.role !== "admin"}
                        className="text-success cursor-pointer"
                        onClick={() => {
                          setActiveEmployee(employee);
                          setIsRoleModalOpen(true);
                        }}
                      >
                        <CheckCircle />
                      </button>
                    </div>
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

export default PendingEmployeeTable;
