import { createColumnHelper, type ColumnDef } from "@tanstack/react-table";
import { type Employee } from "@/models/employee-model";

const columnHelper = createColumnHelper<Employee>();

const schedAssignColumns: ColumnDef<Employee, any>[] = [
  columnHelper.accessor("employee_id", {
    header: "Employee ID",
    cell: (info) => info.getValue(),
  }),
  columnHelper.accessor((row) => `${row.first_name} ${row.last_name}`, {
    id: "full_name",
    header: "Name",
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
  columnHelper.accessor(
    (row) => `${row.department_name} - ${row.position_title}`,
    {
      id: "department_position",
      header: "Department & Position",
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
  columnHelper.accessor("schedule_name", {
    header: "Current Schedule",
    cell: (info) =>
      info.getValue() || <p className="text-muted-foreground">Unassigned</p>,
  }),
];

export default schedAssignColumns;
