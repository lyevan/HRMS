import React from "react";
import axios from "axios";
import Input from "./Input";
import Select from "./Select";
import useToastStore from "../../store/toastStore";

import { ShieldUser } from "lucide-react";

const ApprovePendingModal = ({ isModalOpen, setIsModalOpen, employee }) => {
  const [role, setRole] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const { showToast } = useToastStore();

  const handleApproved = async (employee, role) => {
    console.log("Approving employee:", { employee }, role);
    try {
      setIsLoading(true);
      const response = await axios.post(`/invite/approve`, { employee, role });
      console.log("Employee approved:", response.data);
      showToast("Employee marked as approved", "success");
      setIsModalOpen(false); // Close modal after successful submission
    } catch (error) {
      console.error("Error approving employee:", error);
      showToast(
        error.response?.data?.error || error.response?.data?.message,
        "error"
      );
    } finally {
      setIsLoading(false);
    }
  };
  return (
    <dialog
      open={isModalOpen}
      onClose={() => setIsModalOpen(false)}
      className="modal"
    >
      <div className="modal-box shadow-none outline-2 outline-neutral">
        <form
          method="dialog"
          onSubmit={async (e) => {
            e.preventDefault();
            if (!isLoading) {
              await handleApproved(employee, role);
            }
          }}
        >
          <h3 className="font-bold text-lg">Approve Pending Employee</h3>
          <p className="pt-4 pb-1 text-xs">Please select a role:</p>
          <div className="fieldset grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Role"
              name="role"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              required
              options={[
                { value: "admin", label: "Admin" },
                { value: "staff", label: "Staff" },
                { value: "employee", label: "Employee" },
              ]}
            />
          </div>

          <div className="modal-action">
            <button
              className="btn btn-info w-25"
              type="submit"
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="loading loading-ring loading-sm text-accent"></span>
              ) : (
                "Submit"
              )}
            </button>
            <button
              className="btn btn-error"
              type="button"
              onClick={() => setIsModalOpen(false)}
              disabled={isLoading}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </dialog>
  );
};

export default ApprovePendingModal;
