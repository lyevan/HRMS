import React from "react";
import axios from "axios";
import Input from "./Input";
import Select from "./Select";
import { capitalizeEachWord } from "../../utils/stringUtils";

import { BriefcaseBusiness, BadgeInfo } from "lucide-react";
import useToastStore from "../../store/toastStore";

const AddPosition = ({ isModalOpen, setIsModalOpen, department }) => {
  const [formData, setFormData] = React.useState({
    name: "",
    department_id: department?.id,
    description: "",
  });
  const [isLoading, setIsLoading] = React.useState(false);
  const { showToast } = useToastStore();
  const handleSubmit = async () => {
    const submissionData = {
      name: formData.name.toLowerCase().trim(),
      department_id: department?.id,
      description: formData.description.toLowerCase().trim(),
    };
    try {
      setIsLoading(true);

      console.log("Submitting form data:", submissionData);
      const response = await axios.post("/positions", submissionData);
      console.log("Response:", response.data);
      clearForm(); // Clear form fields after submission
      showToast("Position added successfully!", "success");
      setIsModalOpen(false); // Close modal after successful submission
    } catch (error) {
      showToast(
        error.response?.data?.message ||
          error.response?.data?.error ||
          "Failed to add position.",
        "error"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const clearForm = () => {
    setFormData({
      name: "",
      description: "",
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
          <h3 className="font-bold text-lg">
            Add Positions for{" "}
            <strong>{capitalizeEachWord(department?.name)}</strong>
          </h3>
          <p className="pt-4 pb-1 text-xs">Please fill in the details below:</p>
          <p className="pb-4 pl-2 text-error text-xs">* Required</p>
          <div className="fieldset grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              icon={<BriefcaseBusiness />}
              label="Position Name"
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

export default AddPosition;
