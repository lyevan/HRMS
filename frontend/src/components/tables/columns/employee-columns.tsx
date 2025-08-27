import { createColumnHelper } from "@tanstack/react-table";
import EmployeeHeaders from "@/components/tables/headers/employee-headers";
import { type Employee } from "@/models/employee-model";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EllipsisVertical } from "lucide-react";
import { Button } from "@/components/ui/button";

const columnHelper = createColumnHelper<Employee>();

const employeeColumns = (
  setIsModalOpen: (isOpen: boolean) => void,
  setIsEditing: (isEditing: boolean) => void,
  onViewEmployee: (employee: Employee) => void
) => {
  return [
    columnHelper.accessor("employee_id", {
      header: (info) => (
        <EmployeeHeaders info={info} name="Employee ID" isNumber />
      ),
      cell: (info) => info.getValue(),
    }),
    columnHelper.accessor("first_name", {
      header: (info) => <EmployeeHeaders info={info} name="First Name" />,
      cell: (info) => info.getValue(),
    }),
    columnHelper.accessor("last_name", {
      header: (info) => <EmployeeHeaders info={info} name="Last Name" />,
      cell: (info) => info.getValue(),
    }),
    columnHelper.accessor("email", {
      header: (info) => <EmployeeHeaders info={info} name="Email" />,
      cell: (info) => info.getValue(),
    }),
    columnHelper.accessor("department_name", {
      header: (info) => <EmployeeHeaders info={info} name="Department" />,
      cell: (info) => info.getValue(),
    }),
    columnHelper.accessor("position_title", {
      header: (info) => <EmployeeHeaders info={info} name="Position" />,
      cell: (info) => info.getValue(),
    }),
    columnHelper.accessor("status", {
      header: (info) => <EmployeeHeaders info={info} name="Status" />,
      cell: (info) => (
        <span
          className={`px-2 py-1 rounded-full text-xs font-medium ${
            info.getValue() === "active"
              ? "bg-primary/20 text-primary"
              : "bg-destructive/20 text-destructive"
          }`}
        >
          {info.getValue().charAt(0).toUpperCase() + info.getValue().slice(1)}
        </span>
      ),
    }),
    //   More actions column
    columnHelper.display({
      id: "actions",
      header: (info) => <EmployeeHeaders info={info} name="Actions" />,
      cell: (info) => (
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size={"icon"}>
                <EllipsisVertical />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent onCloseAutoFocus={(e) => e.preventDefault()}>
              <DropdownMenuItem
                onClick={() => {
                  const employee = info.row.original; // ✅ Get the complete row data
                  setIsEditing(true);
                  onViewEmployee?.(employee); // ✅ Pass to callback
                  setIsModalOpen(true);
                }}
              >
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  const employee = info.row.original; // ✅ Get the complete row data
                  setIsEditing(false);
                  onViewEmployee?.(employee); // ✅ Pass to callback
                  setIsModalOpen(true);
                }}
              >
                View
              </DropdownMenuItem>
              <DropdownMenuItem variant="destructive" disabled>
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ),
    }),
  ];
};

export default employeeColumns;
