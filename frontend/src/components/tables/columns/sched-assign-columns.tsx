import { createColumnHelper, type ColumnDef } from "@tanstack/react-table";
import { type Employee } from "@/models/employee-model";

const columnHelper = createColumnHelper<Employee>();

const schedAssignColumns: ColumnDef<Employee, any>[] = [
  columnHelper.accessor("employee_id", {
    header: "Employee ID",
    cell: (info) => info.getValue(),
  }),
  columnHelper.accessor("first_name", {
    header: "First Name",
    cell: (info) => info.getValue(),
  }),
  columnHelper.accessor("last_name", {
    header: "Last Name",
    cell: (info) => info.getValue(),
  }),
  columnHelper.accessor("department_name", {
    header: "Department",
    cell: (info) => info.getValue(),
  }),
  columnHelper.accessor("position_title", {
    header: "Position",
    cell: (info) => info.getValue(),
  }),
  columnHelper.display({
    id: "current_schedule",
    header: "Current Schedule",
    cell: () => "N/A",
    enableSorting: false,
    enableColumnFilter: false,
  }),
];

export default schedAssignColumns;
