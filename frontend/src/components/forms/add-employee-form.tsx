import { useEffect, useState } from "react";
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
import { Send } from "lucide-react";

interface AddEmployeeFormProps {
  setOpen: (open: boolean) => void;
}

type FormContactDataField = {
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
};

type FormContractCreationField = {
  contract_start_date: string;
  contract_end_date: string;
  salary_rate: number;
  rate_type: string;
  employment_type_id: number;
  position_id: number;
};

type Department = {
  department_id: number;
  name: string;
  description: string | null;
};

type EmploymentType = {
  employment_type_id: number;
  name: string;
};

type Positions = {
  position_id: number;
  title: string;
  description: string | null;
};

const AddEmployeeForm = ({ setOpen }: AddEmployeeFormProps) => {
  const [selectedDepartment, setSelectedDepartment] = useState<string>("");
  const [selectedPosition, setSelectedPosition] = useState<string>("");
  const [selectedEmploymentType, setSelectedEmploymentType] =
    useState<string>("");
  const [formContactData, setFormContactData] = useState<FormContactDataField>({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    // status: "active",
    // account_type: "admin",
  });
  const [formContractData, setFormContractData] =
    useState<FormContractCreationField>({
      contract_start_date: "",
      contract_end_date: "",
      salary_rate: 0,
      rate_type: "hourly",
      employment_type_id: 0,
      position_id: 0,
    });
  const [isLoading, setIsLoading] = useState(false);
  const [employmentTypes, setEmploymentTypes] = useState<EmploymentType[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [positions, setPositions] = useState<Positions[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      const departments = await getDepartments();
      const employmentTypes = await getEmploymentTypes();
      setDepartments(departments);
      setEmploymentTypes(employmentTypes);
    };

    fetchData();
  }, []);

  useEffect(() => {
    const fetchPositions = async () => {
      if (selectedDepartment) {
        const positions = await getPositions(parseInt(selectedDepartment));
        setPositions(positions);
      }
    };

    fetchPositions();
  }, [selectedDepartment]);

  // Update position_id in contract data when position is selected
  useEffect(() => {
    if (selectedPosition) {
      setFormContractData((prev) => ({
        ...prev,
        position_id: parseInt(selectedPosition),
      }));
    }
  }, [selectedPosition]);

  // Update employment_type_id in contract data when employment type is selected
  useEffect(() => {
    if (selectedEmploymentType) {
      setFormContractData((prev) => ({
        ...prev,
        employment_type_id: parseInt(selectedEmploymentType),
      }));
    }
  }, [selectedEmploymentType]);

  const getEmploymentTypes = async () => {
    try {
      const response = await axios.get("/employment-types");
      return response.data.result;
    } catch (error) {
      console.error("Error fetching employment types:", error);
      toast.error("Failed to fetch employment types");
      return [];
    }
  };

  const getDepartments = async () => {
    try {
      const response = await axios.get("/departments");
      return response.data.result;
    } catch (error) {
      console.error("Error fetching departments:", error);
      toast.error("Failed to fetch departments");
      return [];
    }
  };

  const getPositions = async (departmentId: number) => {
    console.log("Fetching positions for department:", departmentId);
    try {
      const response = await axios.get(`positions/department/${departmentId}`);
      console.log("Fetched positions:", response.data.result);
      return response.data.result;
    } catch (error) {
      console.error("Error fetching positions:", error);
      toast.error("Failed to fetch positions");
      return [];
    }
  };

  const handleSubmit = async () => {
    console.log("Submitting form with data:", {
      employee_information: formContactData,
      contract_information: formContractData,
      selectedPosition,
      selectedEmploymentType,
      "position_id (parsed)": parseInt(selectedPosition),
      "employment_type_id (parsed)": parseInt(selectedEmploymentType),
    });
    try {
      setIsLoading(true);
      const response = await axios.post("/invite/pending", {
        employee_information: formContactData,
        contract_information: formContractData,
      });

      console.log("Employee added:", response.data);
      toast.success("Employee added successfully");
      setFormContactData({
        first_name: "",
        last_name: "",
        email: "",
        phone: "",
        // status: "active",
        // account_type: "employee",
      });
      setError("");
      setOpen(false);
    } catch (error) {
      setError(
        (error as any).response?.data?.message ||
          (error as any).response?.data?.error ||
          "Failed to add employee"
      );
      console.error("Error adding employee:", error);
      toast.error(
        (error as any).response?.data?.message ||
          (error as any).response?.data?.error ||
          "Failed to add employee"
      );
    } finally {
      setIsLoading(false);
      setError("");
    }
  };
  const textFormFields: Array<{
    value: keyof FormContactDataField;
    label: string;
    type: string;
  }> = [
    { value: "first_name", label: "First Name *", type: "text" },
    { value: "last_name", label: "Last Name *", type: "text" },
    { value: "email", label: "Email *", type: "email" },
    { value: "phone", label: "Phone Number", type: "tel" },
  ];

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        handleSubmit();
      }}
      className="flex flex-col md:flex-row gap-8 w-full h-full mt-4"
    >
      {/* Employee Information Container */}
      <div className="flex flex-col gap-4 w-full flex-1">
        <h3 className="font-semibold">Employee Information</h3>
        <hr></hr>
        {textFormFields.map((field) => (
          <div className="flex flex-col gap-2" key={field.value}>
            <Label htmlFor={field.value}>{field.label}</Label>
            <Input
              id={field.value}
              type={field.type}
              value={formContactData[field.value]}
              required={field.value === "phone" ? false : true}
              onChange={(e) =>
                setFormContactData({
                  ...formContactData,
                  [field.value]: e.target.value,
                })
              }
            />
          </div>
        ))}
      </div>
      {/* Create Contract Container */}
      <div className="flex flex-col gap-4 w-full flex-1">
        <h3 className="font-semibold">Create Employee Contract</h3>
        <hr></hr>
        <div className="flex gap-2 w-full">
          {/* Contract Start Date */}
          <div className="flex flex-col gap-2 flex-1">
            <Label htmlFor="contract_start_date">Contract Start Date *</Label>
            <Input
              id="contract_start_date"
              type="date"
              value={formContractData.contract_start_date}
              required
              onChange={(e) =>
                setFormContractData({
                  ...formContractData,
                  contract_start_date: e.target.value,
                })
              }
            />
          </div>
          {/* Contract End Date */}
          <div className="flex flex-col gap-2 flex-1">
            <Label htmlFor="contract_end_date">Contract End Date</Label>
            <Input
              id="contract_end_date"
              type="date"
              value={formContractData.contract_end_date}
              onChange={(e) =>
                setFormContractData({
                  ...formContractData,
                  contract_end_date: e.target.value,
                })
              }
            />
          </div>
        </div>
        {/* Rate and Rate Type */}
        <div className="flex gap-2 w-full">
          <div className="flex flex-col gap-2 flex-1">
            <Label htmlFor="rate">Rate *</Label>
            <Input
              id="rate"
              type="number"
              step={0.01}
              required
              value={formContractData.salary_rate}
              onChange={(e) =>
                setFormContractData({
                  ...formContractData,
                  salary_rate: e.target.valueAsNumber,
                })
              }
            />
          </div>
          <div className="flex flex-col gap-2 flex-1">
            <Label htmlFor="rate">Rate Type *</Label>
            <Select
              value={formContractData.rate_type}
              onValueChange={(value: string) =>
                setFormContractData({
                  ...formContractData,
                  rate_type: value,
                })
              }
              required
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select rate type" />
              </SelectTrigger>
              <SelectContent className="">
                <SelectItem value="hourly">Hourly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
                <SelectItem value="yearly">Yearly</SelectItem>
                <SelectItem value="exempted">Exempted</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Department Selection */}
        <div className="flex flex-col gap-2 w-full">
          <Label>Department *</Label>
          <Select
            value={selectedDepartment}
            onValueChange={(value: string) => setSelectedDepartment(value)}
            required
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select department" />
            </SelectTrigger>
            <SelectContent className="">
              {departments?.map((department) => (
                <SelectItem
                  key={department.department_id}
                  className=""
                  value={department.department_id.toString()}
                >
                  {department.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Positions Selection */}
        <div className="flex flex-col gap-2">
          <Label>Position *</Label>
          <Select
            value={selectedPosition}
            onValueChange={(value: string) => setSelectedPosition(value)}
            required
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select position" />
            </SelectTrigger>
            <SelectContent className="">
              {selectedDepartment ? (
                positions.map((position) => (
                  <SelectItem
                    key={position.position_id + position.title}
                    className=""
                    value={position.position_id.toString()}
                  >
                    {position.title}
                  </SelectItem>
                ))
              ) : (
                <SelectItem disabled value="Select a department first">
                  Select a department first
                </SelectItem>
              )}
            </SelectContent>
          </Select>
        </div>
        {/* Employment Type */}
        <div className="flex flex-col gap-2">
          <Label>Employment Type *</Label>
          <Select
            value={selectedEmploymentType}
            onValueChange={(value: string) => setSelectedEmploymentType(value)}
            required
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select employment type" />
            </SelectTrigger>
            <SelectContent className="">
              {employmentTypes.map((type) => (
                <SelectItem
                  key={type.employment_type_id}
                  value={type.employment_type_id.toString()}
                >
                  {type.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {error && <div className="text-red-500 mt-2">{error}</div>}
        <div>
          <Button type="submit" disabled={isLoading}>
            <Send />
            {isLoading ? "Sending..." : "Send Onboarding Form"}
          </Button>
        </div>
      </div>
      {/* <div>
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
      </div> */}
    </form>
  );
};

export default AddEmployeeForm;
