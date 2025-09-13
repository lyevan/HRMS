import { type PendingEmployee } from "@/models/pending-employee-model";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useEffect, useState } from "react";
import { useForm, FormProvider } from "react-hook-form";
import {
  BookUser,
  UserRoundSearch,
  Info,
  IdCard,
  Building,
} from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import LabelAndInput from "../label-input-readonly";
import { Switch } from "../ui/switch";
import { Label } from "../ui/label";
import { Button } from "../ui/button";
import {
  useSelectedPendingEmployee,
  useSetSelectedPendingEmployee,
} from "@/store/pendingEmployeeStore";
import Modal from "../modal";
import { toTitleCase } from "@/lib/stringMethods";
import { toast } from "sonner";

interface PendingEmployeeDirectoryProps {
  employee: PendingEmployee | null;
  isReadOnly?: boolean;
}

const PendingEmployeeDirectory = ({
  employee: initialEmployee,
  isReadOnly: initialReadOnlyState = true,
}: PendingEmployeeDirectoryProps) => {
  const isMobile = useIsMobile();
  const [isReadOnly, setIsReadOnly] = useState(initialReadOnlyState);
  const [isViewImageOpen, setViewImageOpen] = useState(false);

  // Use Zustand store
  const selectedPendingEmployee = useSelectedPendingEmployee();
  const setSelectedPendingEmployee = useSetSelectedPendingEmployee();

  // IMPORTANT: Use selectedPendingEmployee from store as primary source
  const employee = selectedPendingEmployee || initialEmployee;

  // Initialize React Hook Form
  const form = useForm<PendingEmployee>({
    defaultValues: employee || {},
  });

  // Update form when employee changes
  useEffect(() => {
    if (employee) {
      form.reset(employee);
    }
  }, [employee, form]);

  // Handle form submission
  const onSubmit = async (_data: PendingEmployee) => {
    try {
      // TODO: Implement API call to update pending employee
      // console.log("Updating pending employee:", data);
      toast.success("Pending employee updated successfully!");
      setIsReadOnly(true);
    } catch (error) {
      // console.error("Error updating pending employee:", error);
      toast.error("Failed to update pending employee");
    }
  };
  // Set employee in store when prop changes
  useEffect(() => {
    if (
      initialEmployee &&
      initialEmployee.pending_employee_id !==
        selectedPendingEmployee?.pending_employee_id
    ) {
      setSelectedPendingEmployee(initialEmployee);
    }
  }, [initialEmployee, selectedPendingEmployee, setSelectedPendingEmployee]);

  // Personal Information array
  const personalInformation = [
    {
      id: "first-name",
      label: "First Name",
      name: "first_name",
    },
    {
      id: "middle-name",
      label: "Middle Name",
      name: "middle_name",
    },
    {
      id: "last-name",
      label: "Last Name",
      name: "last_name",
    },
    {
      id: "suffix",
      label: "Suffix",
      name: "suffix",
    },
    {
      id: "nickname",
      label: "Nickname",
      name: "nickname",
    },
    {
      id: "sex",
      label: "Sex",
      name: "sex",
    },
    {
      id: "date-of-birth",
      label: "Date of Birth",
      name: "date_of_birth",
      type: "date",
    },
    {
      id: "civil-status",
      label: "Civil Status",
      name: "civil_status",
    },
    {
      id: "religion",
      label: "Religion",
      name: "religion",
    },
    {
      id: "citizenship",
      label: "Citizenship",
      name: "citizenship",
    },
  ];

  // Contact Information array
  const contactInformation = [
    {
      id: "email",
      label: "Email",
      name: "email",
      type: "email",
    },
    {
      id: "phone",
      label: "Phone",
      name: "phone",
      type: "tel",
    },
    {
      id: "telephone",
      label: "Telephone",
      name: "telephone",
      type: "tel",
    },
    {
      id: "current-address",
      label: "Current Address",
      name: "current_address",
    },
    {
      id: "permanent-address",
      label: "Permanent Address",
      name: "permanent_address",
    },
  ];
  // Employee Profile array
  const employeeProfile = [
    {
      id: "pending-employee-id",
      label: "Pending Employee ID",
      name: "pending_employee_id",
    },
    {
      id: "department",
      label: "Department",
      name: "department_name",
    },
    {
      id: "position",
      label: "Position",
      name: "position_title",
    },
    {
      id: "status",
      label: "Status",
      name: "status",
    },
  ];

  // Employment Information array
  const employmentInformation = [
    {
      id: "salary-rate",
      label: "Salary Rate",
      name: "rate",
      type: "number",
    },
    {
      id: "rate-type",
      label: "Rate Type",
      name: "rate_type",
    },
    {
      id: "created-at",
      label: "Created Date",
      name: "created_at",
      type: "date",
    },
  ];

  // System Information array
  const systemInformation = [
    {
      id: "government-id",
      label: "Government ID Numbers ID",
      name: "government_id_numbers_id",
    },
    {
      id: "avatar-url",
      label: "Avatar URL",
      name: "avatar_url",
    },
  ];

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
                <TabsTrigger value="contract">
                  <Building />
                </TabsTrigger>
                <TabsTrigger value="system">
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
                <TabsTrigger value="contract">
                  <Building /> Contract Details
                </TabsTrigger>
                <TabsTrigger value="system">
                  <IdCard /> System Information
                </TabsTrigger>
              </>
            )}
          </TabsList>
          <div className="flex flex-1 justify-center items-start mt-10 flex-col sm:flex-row">
            <div className="flex flex-col items-center gap-2 flex-1 w-full">
              {/* Use a simplified avatar section for pending employees */}
              <div className="relative">
                <div
                  className="w-32 h-32 rounded-full flex justify-center items-center overflow-hidden border-4 border-primary/20 cursor-pointer"
                  onClick={() => {
                    if (employee?.avatar_url) setViewImageOpen(true);
                  }}
                >
                  {employee?.avatar_url ? (
                    <img
                      src={employee.avatar_url}
                      alt="Avatar"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.src = "/default-avatar.png";
                      }}
                    />
                  ) : (
                    <div className="flex justify-center items-center text-4xl">
                      {employee?.first_name.charAt(0).toUpperCase() || ""}
                      {employee?.last_name.charAt(0).toUpperCase() || ""}
                    </div>
                  )}
                </div>
              </div>
              <p className="text-2xl font-semibold text-primary">
                {employee?.first_name} {employee?.last_name}
              </p>
              <p className="text-xs">ID: {employee?.pending_employee_id}</p>
              <p>{employee?.position_title || "Position not assigned"}</p>
              <p>{employee?.department_name || "Department not assigned"}</p>
              <div
                className={`px-3 py-1 rounded-full text-sm font-medium ${
                  employee?.status === "pending"
                    ? "bg-yellow-100 text-yellow-800"
                    : employee?.status === "registering"
                    ? "bg-blue-100 text-blue-800"
                    : employee?.status === "for reviewing"
                    ? "bg-orange-100 text-orange-800"
                    : employee?.status === "for approval"
                    ? "bg-purple-100 text-purple-800"
                    : employee?.status === "approved"
                    ? "bg-green-100 text-green-800"
                    : employee?.status === "rejected"
                    ? "bg-red-100 text-red-800"
                    : "bg-gray-100 text-gray-800"
                }`}
              >
                {toTitleCase(employee?.status || "")}
              </div>{" "}
              <div className="flex items-center gap-2 mt-4 p-2 border rounded-lg">
                <Switch
                  id="readonly-mode"
                  checked={isReadOnly}
                  onCheckedChange={setIsReadOnly}
                />
                <Label htmlFor="readonly-mode" className="text-sm">
                  Read-Only Mode
                </Label>
              </div>
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
              {" "}
              <TabsContent value="personal">
                {employee ? (
                  <div className="flex flex-col sm:flex-row items-center justify-center ">
                    <div className="flex flex-col sm:grid grid-cols-2 gap-8 mt-4 sm:mt-0 sm:ml-10 w-full">
                      <div className="flex flex-col gap-2">
                        <p className="font-black mb-2">Personal Information</p>
                        {personalInformation.map((info) => (
                          <LabelAndInput
                            key={info.id}
                            name={info.name}
                            label={info.label}
                            isReadOnly={isReadOnly}
                            type={info.type}
                          />
                        ))}
                      </div>
                      <div className="flex flex-col gap-2">
                        <p className="font-black mb-2">Contact Information</p>
                        {contactInformation.map((info) => (
                          <LabelAndInput
                            key={info.id}
                            name={info.name}
                            label={info.label}
                            isReadOnly={isReadOnly}
                            type={info.type}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <p>No pending employee selected</p>
                )}
              </TabsContent>{" "}
              <TabsContent value="profile">
                <div className="flex flex-col sm:flex-row items-center justify-center w-full ">
                  <div className="flex flex-col sm:grid grid-cols-2 gap-8 mt-4 sm:mt-0 sm:ml-10 w-full">
                    <div className="flex flex-col gap-2 w-full">
                      <p className="font-black mb-2">Employee Details</p>
                      {employeeProfile.map((info) => (
                        <LabelAndInput
                          key={info.id}
                          name={info.name}
                          label={info.label}
                          isReadOnly={isReadOnly}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </TabsContent>
              <TabsContent value="employment">
                <div className="flex flex-col sm:flex-row items-center justify-center ">
                  <div className="flex flex-col sm:grid grid-cols-2 gap-8 mt-4 sm:mt-0 sm:ml-10 w-full">
                    <div className="flex flex-col gap-2 w-full">
                      <p className="font-black mb-2">Employment Information</p>
                      {employmentInformation.map((info) => (
                        <LabelAndInput
                          key={info.id}
                          name={info.name}
                          label={info.label}
                          isReadOnly={isReadOnly}
                          type={info.type}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </TabsContent>{" "}
              <TabsContent value="contract">
                <div className="flex flex-col sm:flex-row items-center justify-center ">
                  <div className="flex flex-col sm:grid grid-cols-2 gap-8 mt-4 sm:mt-0 sm:ml-10 w-full">
                    <div className="flex flex-col gap-2 w-full">
                      <p className="font-black mb-2">Contract Details</p>
                      <p className="text-sm text-gray-500 mb-4">
                        Contract information will be available once the employee
                        is approved and moved to the main employee system.
                      </p>
                      <LabelAndInput
                        name="contract_id"
                        label="Contract ID"
                        isReadOnly={true}
                        type="text"
                      />
                    </div>
                  </div>
                </div>
              </TabsContent>{" "}
              <TabsContent value="system">
                <div className="flex flex-col sm:flex-row items-center justify-center w-full ">
                  <div className="flex flex-col sm:grid grid-cols-2 gap-8 mt-4 sm:mt-0 sm:ml-10 w-full">
                    <div className="flex flex-col gap-2 w-full">
                      <p className="font-black mb-2">System Information</p>
                      {systemInformation.map((info) => (
                        <LabelAndInput
                          key={info.id}
                          name={info.name}
                          label={info.label}
                          isReadOnly={true}
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

export default PendingEmployeeDirectory;
