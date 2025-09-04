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
  toTitleCase,
} from "./stringMethods";

export const getPersonalInformation = (employee: Employee | null) => {
  const personalInformation = [
    {
      id: "first_name",
      label: "First Name",
      value: capitalizeFirstLetter(employee?.first_name || "--"),
      type: "text",
    },
    {
      id: "middle_name",
      label: "Middle Name",
      value: capitalizeFirstLetter(employee?.middle_name || "--"),
      type: "text",
    },
    {
      id: "last_name",
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
      id: "date_of_birth",
      label: "Birthdate",
      value: formatDate(employee?.date_of_birth || null) || "--",
      type: "text",
    },
    {
      id: "sex",
      label: "Sex",
      value: capitalizeFirstLetter(employee?.sex || "--"),
      type: "text",
    },
    {
      id: "civil_status",
      label: "Civil Status",
      value: toTitleCase(employee?.civil_status || "--"),
      type: "text",
    },
    {
      id: "religion",
      label: "Religion",
      value: capitalizeFirstLetter(employee?.religion || "--"),
      type: "text",
    },
    {
      id: "citizenship",
      label: "Citizenship",
      value: capitalizeFirstLetter(employee?.citizenship || "--"),
      type: "text",
    },
  ];
  return personalInformation;
};

export const getContactInformation = (employee: Employee | null) => {
  const contactInformation = [
    {
      id: "current_address",
      label: "Current Address",
      value: employee?.current_address || "--",
      type: "text",
    },
    {
      id: "permanent_address",
      label: "Permanent Address",
      value: employee?.permanent_address || "--",
      type: "text",
    },
    { id: "email", label: "Email", value: employee?.email, type: "email" },
    {
      id: "phone",
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
      id: "employee_id",
      label: "Employee ID",
      value: employee?.employee_id,
      type: "text",
    },
    {
      id: "department_name",
      label: "Department",
      value: employee?.department_name,
      type: "text",
    },
    {
      id: "position_title",
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
      id: "contract_start_date",
      label: "Hire Date",
      value: formatDate(employee?.contract_start_date || null) || "--",
      type: "date",
    },
    {
      id: "contract_end_date",
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
      id: "employment_type",
      label: "Employment Type",
      value: capitalizeFirstLetter(employee?.employment_type || "--"),
      type: "text",
    },
    // Drill thru leave balance object and render each existing
  ];
  return employmentInformation;
};

export const getCompensationInformation = (employee: Employee | null) => {
  const compensationInformation = [
    {
      id: "rate_type",
      label: "Rate Type",
      value: capitalizeFirstLetter(employee?.rate_type || "--"),
      type: "text",
    },
    {
      id: "salary_rate",
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
      id: "sss_number",
      label: "SSS Number",
      value: formatSSSNumber(employee?.sss_number || null) || "--",
      type: "text",
    },
    {
      id: "hdmf_number",
      label: "Pag-IBIG Number",
      value: formatHDMFNumber(employee?.hdmf_number || null) || "--",
      type: "text",
    },
    {
      id: "philhealth_number",
      label: "PhilHealth Number",
      value:
        formatPhilhealthNumber(employee?.philhealth_number || null) || "--",
      type: "text",
    },
    {
      id: "tin_number",
      label: "TIN Number",
      value: formatTINNumber(employee?.tin_number || null) || "--",
      type: "text",
    },
  ];
  return identificationInformation;
};
