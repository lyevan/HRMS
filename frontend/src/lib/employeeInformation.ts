import type { Employee } from "@/models/employee-model";
import {
  capitalizeFirstLetter,
  getAge,
  formatDate,
  formatMoney,
  formatSSSNumber,
  formatHDMFNumber,
  formatPhilhealthNumber,
  formatTINNumber,
} from "./stringMethods";

export const getPersonalInformation = (employee: Employee | null) => {
  const personalInformation = [
    {
      id: "first-name",
      label: "First Name",
      value: capitalizeFirstLetter(employee?.first_name || "--"),
      type: "text",
    },
    {
      id: "middle-name",
      label: "Middle Name",
      value: capitalizeFirstLetter(employee?.middle_name || "--"),
      type: "text",
    },
    {
      id: "last-name",
      label: "Last Name",
      value: capitalizeFirstLetter(employee?.last_name || "--"),
      type: "text",
    },
    {
      id: "suffix",
      label: "Suffix",
      value: capitalizeFirstLetter(employee?.suffix || "--"),
      type: "text",
    },
    {
      id: "nickname",
      label: "Nickname",
      value: capitalizeFirstLetter(employee?.nickname || "--"),
      type: "text",
    },
    {
      id: "age",
      label: "Age",
      value: getAge(employee?.date_of_birth || null).toString(),
      type: "text",
    },
    {
      id: "birthdate",
      label: "Birthdate",
      value: formatDate(employee?.date_of_birth || null) || "--",
      type: "text",
    },
    {
      id: "gender",
      label: "Gender",
      value: capitalizeFirstLetter(employee?.gender || "--"),
      type: "text",
    },
    {
      id: "civil-status",
      label: "Civil Status",
      value: capitalizeFirstLetter(employee?.civil_status || "--"),
      type: "text",
    },
    {
      id: "religion",
      label: "Religion",
      value: capitalizeFirstLetter(employee?.religion || "--"),
      type: "text",
    },
    {
      id: "nationality",
      label: "Nationality",
      value: capitalizeFirstLetter(employee?.citizenship || "--"),
      type: "text",
    },
  ];
  return personalInformation;
};

export const getContactInformation = (employee: Employee | null) => {
  const contactInformation = [
    {
      id: "current-address",
      label: "Current Address",
      value: employee?.current_address || "--",
      type: "text",
    },
    {
      id: "permanent-address",
      label: "Permanent Address",
      value: employee?.permanent_address || "--",
      type: "text",
    },
    { id: "email", label: "Email", value: employee?.email, type: "email" },
    {
      id: "mobile",
      label: "Mobile",
      value: employee?.phone || "--",
      type: "tel",
    },
    {
      id: "telephone",
      label: "Telephone",
      value: employee?.telephone || "--",
      type: "tel",
    },
  ];

  return contactInformation;
};

export const getEmployeeProfile = (employee: Employee | null) => {
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
  return employeeProfile;
};

export const getEmploymentInformation = (employee: Employee | null) => {
  const employmentInformation = [
    {
      id: "hire-date",
      label: "Hire Date",
      value: formatDate(employee?.contract_start_date || null) || "--",
      type: "text",
    },
    {
      id: "end-date",
      label: "End Date",
      value: formatDate(employee?.contract_end_date || null) || "--",
      type: "text",
    },
    {
      id: "status",
      label: "Status",
      value: capitalizeFirstLetter(employee?.status || "--"),
      type: "text",
    },
    {
      id: "employment-type",
      label: "Employment Type",
      value: capitalizeFirstLetter(employee?.employment_type || "--"),
      type: "text",
    },
  ];
  return employmentInformation;
};

export const getCompensationInformation = (employee: Employee | null) => {
  const compensationInformation = [
    {
      id: "rate-type",
      label: "Rate Type",
      value: capitalizeFirstLetter(employee?.rate_type || "--"),
      type: "text",
    },
    {
      id: "salary-rate",
      label: "Salary Rate",
      value: formatMoney(employee?.salary_rate || null),
      type: "text",
    },
  ];
  return compensationInformation;
};

export const getIdentificationInformation = (employee: Employee | null) => {
  const identificationInformation = [
    {
      id: "sss-number",
      label: "SSS Number",
      value: formatSSSNumber(employee?.sss_number || null) || "--",
      type: "text",
    },
    {
      id: "pagibig-number",
      label: "Pag-IBIG Number",
      value: formatHDMFNumber(employee?.hdmf_number || null) || "--",
      type: "text",
    },
    {
      id: "philhealth-number",
      label: "PhilHealth Number",
      value:
        formatPhilhealthNumber(employee?.philhealth_number || null) || "--",
      type: "text",
    },
    {
      id: "tin-number",
      label: "TIN Number",
      value: formatTINNumber(employee?.tin_number || null) || "--",
      type: "text",
    },
  ];
  return identificationInformation;
};
