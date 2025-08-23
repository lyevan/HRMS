import { EmployeeTable } from "@/components/tables/employee-table";
import { type Employee } from "@/models/employee-model";
import { useEmployees } from "@/hooks/useEmployees";
import { createColumnHelper } from "@tanstack/react-table";
import EmployeeHeaders from "@/components/tables/headers/employee-headers";
import { EllipsisVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

const columnHelper = createColumnHelper<Employee>();
const columns = [
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
    cell: () => (
      <div className="flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size={"icon"}>
              <EllipsisVertical />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent onCloseAutoFocus={(e) => e.preventDefault()}>
            <DropdownMenuItem onClick={() => toast.warning("Editing employees implementation coming soon")}>
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => toast.warning("Viewing employees implementation coming soon")}>
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

const EmployeeDashboard = () => {
  const { employees, loading, error } = useEmployees();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <span className="ml-2">Loading employees...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-red-500">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <EmployeeTable<Employee, any> columns={columns} data={employees} />
    </div>
  );
};

export default EmployeeDashboard;
