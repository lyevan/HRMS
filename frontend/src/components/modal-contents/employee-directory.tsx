import { type Employee } from "@/models/employee-model";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useEffect, useState } from "react";
import { useForm, FormProvider } from "react-hook-form";

import {
  BookUser,
  UserRoundSearch,
  Info,
  HandCoins,
  IdCard,
} from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import LabelAndInput from "../label-input-readonly";
import LeaveBalancesSection from "../leave-balances-section";
import AvatarSection from "../avatar-section";
import { Switch } from "../ui/switch";
import { Label } from "../ui/label";
import { Button } from "../ui/button";
import {
  useSelectedEmployee,
  useSetSelectedEmployee,
} from "@/store/employeeStore";
import Modal from "../modal";
import {
  getCompensationInformation,
  getContactInformation,
  getEmployeeProfile,
  getEmploymentInformation,
  getIdentificationInformation,
  getPersonalInformation,
} from "@/lib/employeeInformation";
import { toast } from "sonner";
import LabelAndSelect from "../label-select-readonly";
import axios from "axios";

interface EmployeeDirectoryProps {
  employee: Employee | null;
  isReadOnly?: boolean;
}

const EmployeeDirectory = ({
  employee: initialEmployee,
  isReadOnly: initialReadOnlyState = true,
}: EmployeeDirectoryProps) => {
  const isMobile = useIsMobile();
  const [isReadOnly, setIsReadOnly] = useState(initialReadOnlyState);
  const [isViewImageOpen, setViewImageOpen] = useState(false);
  // Use Zustand store
  const selectedEmployee = useSelectedEmployee();
  const setSelectedEmployee = useSetSelectedEmployee();

  // Helper function to safely convert date to YYYY-MM-DD format with timezone compensation
  const safeDateToYMD = (dateString: string | null): string | null => {
    if (!dateString) return null;

    console.log("Original date string:", dateString);

    // If it's already in YYYY-MM-DD format, return as is
    if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
      console.log("Already in YYYY-MM-DD format, returning:", dateString);
      return dateString;
    }

    // If it's an ISO string (contains T), extract the date part and apply timezone compensation
    if (dateString.includes("T")) {
      const datePart = dateString.split("T")[0];
      console.log("Extracted from ISO string:", datePart);

      // Add +1 day compensation for timezone issues in edit mode
      const date = new Date(datePart + "T12:00:00"); // Use noon to avoid timezone edge cases
      date.setDate(date.getDate() + 1);

      const compensatedDate = date.toISOString().split("T")[0];
      console.log("Applied +1 day compensation:", {
        original: datePart,
        compensated: compensatedDate,
      });

      return compensatedDate;
    }

    // For date strings that might be in various formats, try regex first
    const dateMatch = dateString.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (dateMatch) {
      const result = `${dateMatch[1]}-${dateMatch[2]}-${dateMatch[3]}`;
      console.log("Matched simple date format:", result);
      return result;
    }

    // If we can't parse it safely, return the original string
    console.log("Could not parse date safely, returning original:", dateString);
    return dateString;
  };
  // Helper function to convert employee data for form initialization
  const transformEmployeeDataForForm = (employee: Employee) => {
    const transformedData = { ...employee };

    // Convert dates to YYYY-MM-DD format for date inputs
    if (employee.date_of_birth) {
      const convertedDate =
        safeDateToYMD(employee.date_of_birth) || employee.date_of_birth;
      console.log("🔍 Form initialization - date_of_birth:", {
        original: employee.date_of_birth,
        converted: convertedDate,
        willBeUsedForFormInput: convertedDate,
      });
      transformedData.date_of_birth = convertedDate;
    }

    if (employee.contract_start_date) {
      transformedData.contract_start_date =
        safeDateToYMD(employee.contract_start_date) ||
        employee.contract_start_date;
    }

    if (employee.contract_end_date) {
      transformedData.contract_end_date =
        safeDateToYMD(employee.contract_end_date) || employee.contract_end_date;
    }

    console.log("🚀 Final transformed data for form:", transformedData);
    return transformedData;
  };

  // IMPORTANT: Use selectedEmployee from store as primary source
  const employee = selectedEmployee || initialEmployee;
  // Initialize React Hook Form
  const form = useForm<Employee>({
    defaultValues: employee ? transformEmployeeDataForForm(employee) : {},
  });

  const selectFields = [
    {
      id: "civil_status",
      options: [
        { value: "single", label: "Single" },
        { value: "married", label: "Married" },
        { value: "widowed", label: "Widowed" },
        { value: "divorced", label: "Divorced" },
        { value: "separated", label: "Separated" },
      ],
    },
    {
      id: "sex",
      options: [
        { value: "male", label: "Male" },
        { value: "female", label: "Female" },
        { value: "rather not say", label: "Rather Not Say" },
      ],
    },
    {
      id: "suffix",
      options: [
        { value: "none", label: "--" },
        { value: "Jr.", label: "Jr." },
        { value: "Sr.", label: "Sr." },
        { value: "II", label: "II" },
        { value: "III", label: "III" },
        { value: "IV", label: "IV" },
        { value: "V", label: "V" },
      ],
    },
  ];

  // Fields to exclude from form registration (read-only computed fields)
  const excludedFields = [
    "age",
    "contract_end_date",
    "contract_start_date",
    "employment_type",
    "leave_balances",
    "position_title",
    "rate_type",
    "salary_rate",
    "department_name",
    "department_id",
    "position_id",
    "sss_number",
    "hdmf_number",
    "philhealth_number",
    "tin_number",
    "status",
    "employee_id",
  ]; // Update form when employee changes
  useEffect(() => {
    if (employee) {
      const transformedEmployee = transformEmployeeDataForForm(employee);
      form.reset(transformedEmployee);
    }
  }, [employee, form]);

  // Debug form values when switching between read-only and edit modes
  useEffect(() => {
    const currentValues = form.getValues();
    console.log(`🔄 Mode changed to: ${isReadOnly ? "READ-ONLY" : "EDIT"}`, {
      mode: isReadOnly ? "read-only" : "edit",
      dateOfBirth: currentValues.date_of_birth,
      contractStartDate: currentValues.contract_start_date,
      allFormValues: currentValues,
    });
  }, [isReadOnly, form]);

  // Handle form submission
  const onSubmit = async (data: Employee) => {
    try {
      // Filter out excluded fields from submission data
      const filteredData = Object.fromEntries(
        Object.entries(data).filter(([key]) => !excludedFields.includes(key))
      ) as Partial<Employee>;

      console.log("Submitting form data: ", filteredData);
      await axios.put(`/employees/${data.employee_id}`, filteredData);
      console.log("Updating employee:", filteredData);
      toast.success("Employee updated successfully!", {
        description: "Reload the page to see updated data.",
      });
      setIsReadOnly(true);
    } catch (error) {
      console.error("Error updating employee:", error);
      toast.error("Failed to update employee");
    }
  };

  // const onChangeEventHandler = (event: React.ChangeEvent<HTMLInputElement>) => {
  //   // Handle input changes if needed
  //   const key = event.target.name;
  //   const value = event.target.value;
  // };

  // Set employee in store when prop changes
  useEffect(() => {
    if (
      initialEmployee &&
      initialEmployee.employee_id !== selectedEmployee?.employee_id
    ) {
      setSelectedEmployee(initialEmployee);
    }
  }, [initialEmployee, selectedEmployee, setSelectedEmployee]);

  // Personal Information array
  const personalInformation = getPersonalInformation(employee);
  // Contact Information array
  const contactInformation = getContactInformation(employee);
  // Employee Profile array
  const employeeProfile = getEmployeeProfile(employee);
  // Employment Information array
  const employmentInformation = getEmploymentInformation(employee);
  // Compensation Information array
  const compensationInformation = getCompensationInformation(employee);
  // Identification Information array
  const identificationInformation = getIdentificationInformation(employee);
  return (
    <FormProvider {...form}>
      <Modal
        open={isViewImageOpen}
        setOpen={setViewImageOpen}
        title="View Profile Image"
        description=""
      >
        <img
          src={employee?.avatar_url || "/default-avatar.png"}
          alt="Profile"
          className="max-w-full max-h-full object-contain"
        />
      </Modal>

      <div className="flex flex-1">
        <Tabs defaultValue="personal" className="w-full">
          <TabsList className="w-full sticky top-0 z-9999 md:w-fit">
            {isMobile ? (
              <>
                <TabsTrigger value="personal">
                  <BookUser />
                </TabsTrigger>
                <TabsTrigger value="profile">
                  <UserRoundSearch />
                </TabsTrigger>
                <TabsTrigger value="employment">
                  <Info />
                </TabsTrigger>
                <TabsTrigger value="compensation">
                  <HandCoins />
                </TabsTrigger>
                <TabsTrigger value="identification">
                  <IdCard />
                </TabsTrigger>
              </>
            ) : (
              <>
                <TabsTrigger value="personal">
                  <BookUser /> Personal Details
                </TabsTrigger>
                <TabsTrigger value="profile">
                  <UserRoundSearch /> Employee Profile
                </TabsTrigger>
                <TabsTrigger value="employment">
                  <Info /> Employment Information
                </TabsTrigger>
                <TabsTrigger value="compensation">
                  <HandCoins /> Compensation and Deductions
                </TabsTrigger>
                <TabsTrigger value="identification">
                  <IdCard /> Identification
                </TabsTrigger>
              </>
            )}
          </TabsList>
          <div className="flex flex-1 justify-center items-start mt-10 flex-col sm:flex-row">
            <div className="flex flex-col items-center gap-2 flex-1 w-full">
              {/* Pass the employee from store to AvatarSection */}
              <AvatarSection
                employee={employee}
                setViewImageOpen={setViewImageOpen}
              />
              <p className="text-2xl font-semibold text-primary">
                {employee?.first_name} {employee?.last_name} {employee?.suffix}
              </p>
              <p className="text-xs">{employee?.employee_id}</p>
              <p>{employee?.position_title}</p>
              <p>{employee?.department_name}</p>
              <div className="flex items-center gap-2 mt-4 p-2 border rounded-lg">
                <Switch
                  id="readonly-mode"
                  checked={isReadOnly}
                  onCheckedChange={setIsReadOnly}
                />
                <Label htmlFor="readonly-mode" className="text-sm">
                  Read-Only Mode
                </Label>
              </div>{" "}
              {!isReadOnly && (
                <Button
                  className="text-sm"
                  variant="outline"
                  onClick={form.handleSubmit(onSubmit)}
                  disabled={form.formState.isSubmitting}
                >
                  {form.formState.isSubmitting ? "Saving..." : "Save Changes"}
                </Button>
              )}
            </div>

            <div className="flex-2">
              <TabsContent value="personal">
                {employee ? (
                  <div className="flex flex-col sm:flex-row items-center justify-center ">
                    <div className="flex flex-col sm:grid grid-cols-2 gap-8 mt-4 sm:mt-0 sm:ml-10 w-full">
                      {" "}
                      <div className="flex flex-col gap-2">
                        <p className="font-black mb-2">Personal Information</p>{" "}
                        {personalInformation.map((info) => {
                          // Find if this field should be a select
                          const selectField = selectFields.find(
                            (field) => field.id === info.id
                          );

                          if (selectField) {
                            return (
                              <LabelAndSelect
                                key={info.id}
                                name={info.id}
                                label={info.label}
                                options={selectField.options}
                                isReadOnly={isReadOnly}
                              />
                            );
                          } else {
                            return (
                              <LabelAndInput
                                key={info.id}
                                name={info.id}
                                label={info.label}
                                isReadOnly={isReadOnly}
                                type={info.type}
                                displayValue={
                                  isReadOnly ? info.value : undefined
                                }
                                excludeFromForm={excludedFields.includes(
                                  info.id
                                )}
                              />
                            );
                          }
                        })}
                      </div>
                      <div className="flex flex-col gap-2">
                        <p className="font-black mb-2">Contact Information</p>{" "}
                        {contactInformation.map((info) => (
                          <LabelAndInput
                            key={info.id}
                            name={info.id}
                            label={info.label}
                            isReadOnly={isReadOnly}
                            type={info.type}
                            displayValue={isReadOnly ? info.value : undefined}
                            excludeFromForm={excludedFields.includes(info.id)}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <p>No employee selected</p>
                )}
              </TabsContent>

              <TabsContent value="profile">
                <div className="flex flex-col sm:flex-row items-center justify-center w-full ">
                  <div className="flex flex-col sm:grid grid-cols-2 gap-8 mt-4 sm:mt-0 sm:ml-10 w-full">
                    {" "}
                    <div className="flex flex-col gap-2 w-full">
                      <p className="font-black mb-2">Employee Details</p>{" "}
                      {employeeProfile.map((info) => (
                        <LabelAndInput
                          key={info.id}
                          name={info.id}
                          label={info.label}
                          isReadOnly={isReadOnly}
                          displayValue={isReadOnly ? info.value : undefined}
                          excludeFromForm={excludedFields.includes(info.id)}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="employment">
                <div className="flex flex-col sm:flex-row items-center justify-center ">
                  <div className="flex flex-col sm:grid grid-cols-2 gap-8 mt-4 sm:mt-0 sm:ml-10 w-full">
                    {" "}
                    <div className="flex flex-col gap-2 w-full">
                      <p className="font-black mb-2">Contract Information</p>{" "}
                      {employmentInformation.map((info) => (
                        <LabelAndInput
                          key={info.id}
                          name={info.id}
                          label={info.label}
                          isReadOnly={isReadOnly}
                          type={info.type}
                          displayValue={isReadOnly ? info.value : undefined}
                          excludeFromForm={excludedFields.includes(info.id)}
                        />
                      ))}
                    </div>{" "}
                    <div className="flex flex-col gap-2 w-full">
                      <p className="font-black mb-2">Leaves Information</p>
                      <LeaveBalancesSection isReadOnly={true} />
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="compensation">
                <div className="flex flex-col sm:flex-row items-center justify-center ">
                  <div className="flex flex-col sm:grid grid-cols-2 gap-8 mt-4 sm:mt-0 sm:ml-10 w-full">
                    <div className="flex flex-col gap-2 w-full">
                      {" "}
                      <p className="font-black mb-2">
                        Compensation and Benefits
                      </p>{" "}
                      {compensationInformation.map((info) => (
                        <LabelAndInput
                          key={info.id}
                          name={info.id}
                          label={info.label}
                          isReadOnly={isReadOnly}
                          type={info.type}
                          displayValue={isReadOnly ? info.value : undefined}
                          excludeFromForm={excludedFields.includes(info.id)}
                        />
                      ))}
                    </div>
                    <div className="flex flex-col gap-2 w-full">
                      <p className="font-black mb-2">Active Loans</p>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="identification">
                <div className="flex flex-col sm:flex-row items-center justify-center w-full ">
                  <div className="flex flex-col sm:grid grid-cols-2 gap-8 mt-4 sm:mt-0 sm:ml-10 w-full">
                    {" "}
                    <div className="flex flex-col gap-2 w-full">
                      <p className="font-black mb-2">Government Numbers</p>{" "}
                      {identificationInformation.map((info) => (
                        <LabelAndInput
                          key={info.id}
                          name={info.id}
                          label={info.label}
                          isReadOnly={isReadOnly}
                          type={info.type}
                          displayValue={isReadOnly ? info.value : undefined}
                          excludeFromForm={excludedFields.includes(info.id)}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </TabsContent>
            </div>
          </div>{" "}
        </Tabs>
      </div>
    </FormProvider>
  );
};

export default EmployeeDirectory;
