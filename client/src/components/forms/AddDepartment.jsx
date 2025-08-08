import React from "react";
import axios from "axios";
import Input from "./Input";
import Select from "./Select";

import { Building, BadgeInfo } from "lucide-react";

const AddDepartment = ({ isModalOpen, setIsModalOpen }) => {
  const [formData, setFormData] = React.useState({
    name: "",
    description: "",
  });
  const [isLoading, setIsLoading] = React.useState(false);
  const handleSubmit = async () => {
    try {
      setIsLoading(true);
      const response = await axios.post("/departments", formData);
      console.log("Success:", response.data);
      setIsModalOpen(false); // Close modal after successful submission
    } catch (error) {
      console.error("Error:", error);
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
              await handleSubmit();
            }
          }}
        >
          <h3 className="font-bold text-lg">Add Departments</h3>
          <p className="pt-4 pb-1 text-xs">Please fill in the details below:</p>
          <p className="pb-4 pl-2 text-error text-xs">* Required</p>
          <div className="fieldset grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              icon={<Building />}
              label="Department Name"
              name="name"
              type="text"
              value={formData.name}
              required
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
            />
            <Input
              icon={<BadgeInfo />}
              label="Description"
              name="description"
              type="text"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
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

export default AddDepartment;
