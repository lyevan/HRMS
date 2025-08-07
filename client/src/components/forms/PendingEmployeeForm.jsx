import { useState } from "react";
import axios from "axios";
import Input from "./Input";
import Select from "./Select";
import {
  Mail,
  Phone,
  Building,
  BriefcaseBusiness,
  PhilippinePeso,
  CalendarPlus,
} from "lucide-react";
import useToastStore from "../../store/toastStore";
const PendingEmployeeForm = ({ isModalOpen, setIsModalOpen }) => {
  const [formData, setFormData] = useState({
    email: "",
    phone: "",
    department: "",
    position: "",
    hourly_rate: "",
    hire_date: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const { showToast } = useToastStore();
  const handleSubmit = async () => {
    console.log(formData);
    try {
      setIsLoading(true);
      const response = await axios.post("/invite/pending", formData);
      console.log("Success:", response.data);
      showToast("Pending employee added successfully!", "success");
      clearFields();
      setIsModalOpen(false); // Close modal after successful submission
    } catch (error) {
      console.error("Error:", error);
      showToast(error.response.data.message, "error");
    } finally {
      setIsLoading(false);
    }
  };

  const clearFields = () => {
    setFormData({
      email: "",
      phone: "",
      department: "",
      position: "",
      hourly_rate: "",
      hire_date: "",
    });
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
              await handleSubmit();
            }
          }}
        >
          <h3 className="font-bold text-lg">Add Pending Employee</h3>
          <p className="pt-4 pb-1 text-xs">Please fill in the details below:</p>
          <p className="pb-4 pl-2 text-error text-xs">* Required</p>
          <div className="fieldset grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              icon={<Mail />}
              label="Email"
              name="email"
              type="email"
              value={formData.email}
              required
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
            />
            <Input
              icon={<Phone />}
              label="Phone Number"
              name="phone"
              type="tel"
              value={formData.phone}
              onChange={(e) =>
                setFormData({ ...formData, phone: e.target.value })
              }
            />{" "}
            <Select
              icon={<Building />}
              label="Department"
              name="department"
              required
              value={formData.department}
              onChange={(e) =>
                setFormData({ ...formData, department: e.target.value })
              }
              options={[
                { value: "hr", label: "HR" },
                { value: "engineering", label: "Engineering" },
                { value: "sales", label: "Sales" },
              ]}
            />
            <Select
              icon={<BriefcaseBusiness />}
              label="Position"
              name="position"
              required
              value={formData.position}
              onChange={(e) =>
                setFormData({ ...formData, position: e.target.value })
              }
              options={[
                { value: "supervisor", label: "Supervisor" },
                { value: "manager", label: "Manager" },
                { value: "staff", label: "Staff" },
              ]}
            />
            <Input
              icon={<PhilippinePeso />}
              label="Hourly Rate"
              name="hourly_rate"
              type="number"
              step="0.01"
              value={formData.hourly_rate}
              required
              onChange={(e) =>
                setFormData({ ...formData, hourly_rate: e.target.value })
              }
            />
            <Input
              icon={<CalendarPlus />}
              label="Hire Date"
              name="hire_date"
              type="date"
              value={formData.hire_date}
              required
              onChange={(e) =>
                setFormData({ ...formData, hire_date: e.target.value })
              }
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

export default PendingEmployeeForm;
