import { type Employee } from "@/models/employee-model";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState } from "react";
import { BookUser, UserRoundSearch, Info, HandCoins } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import LabelAndInput from "../label-input-readonly";
import AvatarSection from "../avatar-section";
import { Switch } from "../ui/switch";
import { Label } from "../ui/label";
import { Button } from "../ui/button";

interface EmployeeDirectoryProps {
  employee: Employee | null;
  isReadOnly?: boolean;
}

const EmployeeDirectory = ({
  employee,
  isReadOnly: initialReadOnlyState = true,
}: EmployeeDirectoryProps) => {
  const isMobile = useIsMobile();

  const [isReadOnly, setIsReadOnly] = useState(initialReadOnlyState);

  const personalInformation = [
    { id: "nickname", label: "Nickname", value: "Nickname", type: "text" },
    { id: "age", label: "Age", value: "--", type: "text" },
    { id: "birthdate", label: "Birthdate", value: "00/00/0000", type: "text" },
    { id: "gender", label: "Gender", value: "Male", type: "text" },
    {
      id: "civil-status",
      label: "Civil Status",
      value: "Civil Status",
      type: "text",
    },
    { id: "religion", label: "Religion", value: "Religion", type: "text" },
    {
      id: "nationality",
      label: "Nationality",
      value: "Nationality",
      type: "text",
    },
  ];

  const contactInformation = [
    {
      id: "current-address",
      label: "Current Address",
      value: "Current Address",
      type: "text",
    },
    {
      id: "permanent-address",
      label: "Permanent Address",
      value: "Permanent Address",
      type: "text",
    },
    { id: "email", label: "Email", value: employee?.email, type: "email" },
    { id: "mobile", label: "Mobile", value: "Mobile", type: "tel" },
    { id: "telephone", label: "Telephone", value: "Telephone", type: "tel" },
  ];

  const employeeProfile = [
    {
      id: "employee-id",
      label: "Employee ID",
      value: employee?.employee_id,
      type: "text",
    },
    {
      id: "department",
      label: "Department",
      value: employee?.department_name,
      type: "text",
    },
    {
      id: "position",
      label: "Position",
      value: employee?.position_title,
      type: "text",
    },
  ];

  const employmentInformation = [
    {
      id: "hire-date",
      label: "Hire Date",
      value: employee?.contract_start_date
        ? new Date(employee?.contract_start_date).toLocaleDateString()
        : "--",
      type: "text",
    },
    {
      id: "end-date",
      label: "End Date",
      value: employee?.contract_end_date
        ? new Date(employee?.contract_end_date).toLocaleDateString()
        : "--",
      type: "text",
    },
    {
      id: "status",
      label: "Status",
      value:
        employee?.status &&
        employee?.status.charAt(0).toUpperCase() + employee?.status.slice(1),
      type: "text",
    },
    {
      id: "employment-type",
      label: "Employment Type",
      value: employee?.employment_type,
      type: "text",
    },
  ];

  return (
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
                <HandCoins /> Compensation and Benefits
              </TabsTrigger>
            </>
          )}
        </TabsList>
        {/* Outer Container */}
        <div className="flex flex-1 justify-center items-start mt-10 flex-col sm:flex-row">
          {/*---------------------------*/}
          {/* Avatar and Name Container */}
          {/*---------------------------*/}
          <div className="flex flex-col items-center gap-2 flex-1 w-full">
            <AvatarSection employee={employee} />
            <p className="text-2xl font-semibold text-primary">
              {employee?.first_name} {employee?.last_name}
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
              
            </div>
            {!isReadOnly && <Button className="text-sm" variant="outline">Save Changes</Button>}
          </div>

          {/*-----------------------*/}
          {/* Information Container */}
          {/*-----------------------*/}
          <div className="flex-2">
            <TabsContent value="personal">
              {employee ? (
                <div className="flex flex-col sm:flex-row items-center justify-center ">
                  {/*---------*/}
                  {/* Details */}
                  {/*---------*/}
                  <div className="flex flex-col sm:grid grid-cols-2 gap-8 mt-4 sm:mt-0 sm:ml-10">
                    {/*------------------*/}
                    {/* Personal Details */}
                    {/*------------------*/}
                    <div className="flex flex-col gap-2">
                      <p className="font-black mb-2">Personal Information</p>
                      {personalInformation.map((info) => (
                        <LabelAndInput
                          key={info.id}
                          id={info.id}
                          label={info.label}
                          value={info.value}
                          isReadOnly={isReadOnly}
                          type={info.type}
                        />
                      ))}
                    </div>
                    {/*-----------------*/}
                    {/* Contact Details */}
                    {/*-----------------*/}
                    <div className="flex flex-col gap-2">
                      <p className="font-black mb-2">Contact Information</p>
                      {contactInformation.map((info) => (
                        <LabelAndInput
                          key={info.id}
                          id={info.id}
                          label={info.label}
                          value={info.value}
                          isReadOnly={isReadOnly}
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
              <div className="flex flex-col sm:flex-row items-center justify-center ">
                <div className="flex flex-col sm:grid grid-cols-2 gap-8 mt-4 sm:mt-0 sm:ml-10">
                  <div className="flex flex-col gap-2">
                    <p className="font-black mb-2">Employee Profile</p>
                    {employeeProfile.map((info) => (
                      <LabelAndInput
                        key={info.id}
                        id={info.id}
                        label={info.label}
                        value={info.value}
                        isReadOnly={isReadOnly}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </TabsContent>
            <TabsContent value="employment">
              <div className="flex flex-col sm:flex-row items-center justify-center ">
                <div className="flex flex-col sm:grid grid-cols-2 gap-8 mt-4 sm:mt-0 sm:ml-10">
                  <div className="flex flex-col gap-2">
                    <p className="font-black mb-2">Employee Profile</p>
                    {employmentInformation.map((info) => (
                      <LabelAndInput
                        key={info.id}
                        id={info.id}
                        label={info.label}
                        value={info.value}
                        isReadOnly={isReadOnly}
                      />
                    ))}
                    {employee?.leave_balances.map((leave) => (
                      <LabelAndInput
                        key={leave.leave_type}
                        id={leave.leave_type}
                        label={leave.leave_type}
                        value={leave.balance.toString()}
                        isReadOnly={isReadOnly}
                        type="number"
                      />
                    ))}
                  </div>
                </div>
              </div>
            </TabsContent>
            <TabsContent value="compensation">
              {employee?.rate_type} {employee?.salary_rate}
            </TabsContent>
          </div>
        </div>
      </Tabs>
    </div>
  );
};

export default EmployeeDirectory;

{
  /* <p>ID: {employee.employee_id}</p>
                <p>Department: {employee.department_name}</p>
                <p>Position: {employee.position_title}</p>
                <p>Status: {employee.status}</p>
                 <p>
                  Hired Date:{" "}
                  {new Date(employee.contract_start_date).toLocaleDateString()}
                </p>
                <p>
                  End of Contract Date:{" "}
                  {employee.contract_end_date
                    ? new Date(employee.contract_end_date).toLocaleDateString()
                    : "N/A"}
                </p>
                <p>Employement Type: {employee.employment_type}</p>
                <p>Rate Type: {employee.rate_type}</p>
                <p>Salary: {employee.salary_rate}</p>

                <ul>
                  <p>Leaves:</p>
                  {employee.leave_balances.map((leave) => (
                    <li className="ml-4" key={leave.leave_type}>
                      {leave.leave_type}: {leave.balance} days
                    </li>
                  ))}
                </ul> */
}
