import { createColumnHelper } from "@tanstack/react-table";
import PendingEmployeeHeaders from "../headers/pending-headers";
import { type Employee } from "@/models/employee-model";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { EllipsisVertical } from "lucide-react";
import { Button } from "@/components/ui/button";

const columnHelper = createColumnHelper<Employee>();

const pendingEmployeeColumns = () => {
  return [
    columnHelper.accessor("employee_id", {
      header: (info) => (
        <PendingEmployeeHeaders info={info} name="Employee ID" isNumber />
      ),
      cell: (info) => info.getValue(),
    }),
    columnHelper.accessor("first_name", {
      header: (info) => (
        <PendingEmployeeHeaders info={info} name="First Name" />
      ),
      cell: (info) => info.getValue(),
    }),
    columnHelper.accessor("last_name", {
      header: (info) => <PendingEmployeeHeaders info={info} name="Last Name" />,
      cell: (info) => info.getValue(),
    }),
    columnHelper.accessor("status", {
      header: (info) => <PendingEmployeeHeaders info={info} name="Status" />,
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
      header: (info) => <PendingEmployeeHeaders info={info} name="Actions" />,
      cell: () => (
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size={"icon"}>
                <EllipsisVertical />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent onCloseAutoFocus={(e) => e.preventDefault()}>
              <DropdownMenuItem onClick={() => {}}>Review</DropdownMenuItem>
              <DropdownMenuItem onClick={() => {}}>Email</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ),
    }),
  ];
};

export default pendingEmployeeColumns;
