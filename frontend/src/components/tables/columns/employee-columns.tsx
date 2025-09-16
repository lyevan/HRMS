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
import { Checkbox } from "@/components/ui/checkbox";

const columnHelper = createColumnHelper<Employee>();

interface EmployeeColumnsOptions {
  setIsModalOpen: (isOpen: boolean) => void;
  setIsEditing: (isEditing: boolean) => void;
  onViewEmployee: (employee: Employee) => void;
  // Bulk selection options
  isItemSelected?: (employee: Employee) => boolean;
  toggleItemSelection?: (employee: Employee) => void;
  toggleAllItems?: (employees: Employee[]) => void;
  allItems?: Employee[];
  enableBulkSelect?: boolean;
}

const employeeColumns = ({
  setIsModalOpen,
  setIsEditing,
  onViewEmployee,
  isItemSelected,
  toggleItemSelection,
  toggleAllItems,
  allItems = [],
  enableBulkSelect = false,
}: EmployeeColumnsOptions) => {
  const columns = [];

  // Add checkbox column if bulk selection is enabled
  if (
    enableBulkSelect &&
    isItemSelected &&
    toggleItemSelection &&
    toggleAllItems
  ) {
    columns.push(
      columnHelper.display({
        id: "select",
        header: () => (
          <Checkbox
            checked={allItems.length > 0 && allItems.every(isItemSelected)}
            onCheckedChange={() => toggleAllItems(allItems)}
            aria-label="Select all"
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={isItemSelected(row.original)}
            onCheckedChange={() => toggleItemSelection(row.original)}
            aria-label={`Select employee ${row.original.employee_id}`}
          />
        ),
        enableSorting: false,
        enableHiding: false,
      })
    );
  }

  columns.push(
    columnHelper.accessor("employee_id", {
      header: (info) => (
        <EmployeeHeaders info={info} name="Employee ID" isNumber />
      ),
      cell: (info) => info.getValue(),
    }),
    columnHelper.accessor((row) => `${row.first_name} ${row.last_name}`, {
      id: "full_name",
      header: (info) => <EmployeeHeaders info={info} name="Full Name" />,
      cell: (info) => info.getValue(),
      sortingFn: (rowA, rowB) => {
        const nameA = `${rowA.original.first_name} ${rowA.original.last_name}`;
        const nameB = `${rowB.original.first_name} ${rowB.original.last_name}`;
        return nameA.localeCompare(nameB);
      },
      filterFn: (row, _columnId, filterValue) => {
        const fullName = `${row.original.first_name} ${row.original.last_name}`;
        return fullName.toLowerCase().includes(filterValue.toLowerCase());
      },
    }),
    columnHelper.accessor("email", {
      header: (info) => <EmployeeHeaders info={info} name="Email" />,
      cell: (info) => info.getValue(),
    }),
    columnHelper.accessor(
      (row) => `${row.department_name} - ${row.position_title}`,
      {
        id: "department_position",
        header: (info) => (
          <EmployeeHeaders info={info} name="Department & Position" />
        ),
        cell: (info) => (
          <div className="flex flex-col">
            <p className="font-medium">{info.row.original.department_name}</p>
            <p className="text-sm text-muted-foreground">
              {info.row.original.position_title}
            </p>
          </div>
        ),
        sortingFn: (rowA, rowB) => {
          const deptA = rowA.original.department_name;
          const deptB = rowB.original.department_name;
          return deptA.localeCompare(deptB);
        },
        filterFn: (row, _columnId, filterValue) => {
          const combined = `${row.original.department_name} ${row.original.position_title}`;
          return combined.toLowerCase().includes(filterValue.toLowerCase());
        },
      }
    ),
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
    })
  );

  return columns;
};

export default employeeColumns;
