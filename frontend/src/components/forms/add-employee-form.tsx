import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import axios from "axios";
import { toast } from "sonner";

interface AddEmployeeFormProps {
  setOpen: (open: boolean) => void;
}

const AddEmployeeForm = ({ setOpen }: AddEmployeeFormProps) => {
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    status: "active",
    account_type: "admin",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    try {
      setIsLoading(true);
      const response = await axios.post("/employees", formData);

      console.log("Employee added:", response.data);
      toast.success("Employee added successfully");
      setFormData({
        first_name: "",
        last_name: "",
        email: "",
        status: "active",
        account_type: "employee",
      });
      setError("");
      setOpen(false);
    } catch (error) {
      setError(
        (error as any).response?.data?.message || "Failed to add employee"
      );
      console.error("Error adding employee:", error);
      toast.error("Failed to add employee");
    } finally {
      setIsLoading(false);
      setError("");
    }
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        handleSubmit();
      }}
      className="flex flex-col gap-4"
    >
      <div>
        <Label htmlFor="first_name">First Name</Label>
        <Input
          id="first_name"
          className="border-primary"
          type="text"
          required
          value={formData.first_name}
          onChange={(e) =>
            setFormData({ ...formData, first_name: e.target.value })
          }
        />
      </div>
      <div>
        <Label htmlFor="last_name">Last Name</Label>
        <Input
          id="last_name"
          className="border-primary"
          type="text"
          value={formData.last_name}
          required
          onChange={(e) =>
            setFormData({ ...formData, last_name: e.target.value })
          }
        />
      </div>
      <div>
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          className="border-primary"
          required
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
        />
      </div>
      <div>
        <Label htmlFor="account_type">Account Type</Label>
        <Select
          value={formData.account_type}
          required
          onValueChange={(value) =>
            setFormData({ ...formData, account_type: value })
          }
        >
          <SelectTrigger className="border-primary w-full">
            <SelectValue placeholder="Select account type" />
          </SelectTrigger>
          <SelectContent className="border-primary">
            <SelectItem
              className="focus:bg-primary focus:text-primary-foreground"
              value="admin"
            >
              Admin
            </SelectItem>

            <SelectItem
              className="focus:bg-primary focus:text-primary-foreground"
              value="staff"
              disabled
            >
              Staff
            </SelectItem>
            <SelectItem
              className="focus:bg-primary focus:text-primary-foreground"
              value="employee"
              disabled
            >
              Employee
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
      {error && <div className="text-red-500 mt-2">{error}</div>}
      <div>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Adding..." : "Add Employee"}
        </Button>
      </div>
    </form>
  );
};

export default AddEmployeeForm;
