import { type ColumnDef } from "@tanstack/react-table";
import DepartmentHeaders from "../headers/department-headers";
import { type Department } from "@/models/department-model";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { EllipsisVertical, Eye, Edit, Trash2, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface DepartmentColumnProps {
  setIsViewDepartmentModalOpen?: (open: boolean) => void;
  setIsEditDepartmentModalOpen?: (open: boolean) => void;
  onViewDetails?: (department: Department) => void;
  onEdit?: (department: Department) => void;
  onDelete?: (department: Department) => void;
}

const departmentColumns = ({
  setIsViewDepartmentModalOpen,
  setIsEditDepartmentModalOpen,
  onViewDetails,
  onEdit,
  onDelete,
}: DepartmentColumnProps) => {
  const handleViewDetails = (department: Department) => {
    if (onViewDetails) {
      onViewDetails(department);
    }
    if (setIsViewDepartmentModalOpen) {
      setIsViewDepartmentModalOpen(true);
    }
  };

  const handleEdit = (department: Department) => {
    if (onEdit) {
      onEdit(department);
    }
    if (setIsEditDepartmentModalOpen) {
      setIsEditDepartmentModalOpen(true);
    }
  };

  const handleDelete = async (department: Department) => {
    if (onDelete) {
      onDelete(department);
    } else {
      toast.warning("Delete functionality not implemented yet");
    }
  };

  return [
    {
      id: "department_id",
      accessorKey: "department_id",
      header: (info: any) => (
        <DepartmentHeaders info={info} name="ID" isNumber={true} />
      ),
      cell: (info: any) => info.getValue(),
    },
    {
      id: "name",
      accessorKey: "name",
      header: (info: any) => (
        <DepartmentHeaders info={info} name="Department Name" />
      ),
      cell: (info: any) => (
        <div className="flex items-center gap-2">
          <Building2 className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">{info.getValue()}</span>
        </div>
      ),
    },
    {
      id: "description",
      accessorKey: "description",
      header: (info: any) => (
        <DepartmentHeaders info={info} name="Description" />
      ),
      cell: (info: any) => (
        <span className="text-muted-foreground">
          {info.getValue() || "No description"}
        </span>
      ),
    },
    {
      id: "created_at",
      accessorKey: "created_at",
      header: (info: any) => (
        <DepartmentHeaders info={info} name="Created Date" />
      ),
      cell: (info: any) => {
        const date = info.getValue();
        return date ? new Date(date).toLocaleDateString() : "—";
      },
    },
    // Actions column
    {
      id: "actions",
      header: (info: any) => <DepartmentHeaders info={info} name="Actions" />,
      cell: ({ row }: { row: any }) => {
        const department = row.original;

        return (
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <EllipsisVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={() => handleViewDetails(department)}>
                  <Eye className="mr-2 h-4 w-4" />
                  View Details
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleEdit(department)}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit Department
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => handleDelete(department)}
                  className="text-red-600"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      },
    },
  ] as ColumnDef<Department>[];
};

export default departmentColumns;
