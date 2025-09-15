import { type ColumnDef } from "@tanstack/react-table";
import PositionHeaders from "../headers/position-headers";
import { type Position } from "@/models/position-model";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  EllipsisVertical,
  Eye,
  Edit,
  Trash2,
  Briefcase,
  Building2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { type Department } from "@/models/department-model";

interface PositionColumnProps {
  setIsViewPositionModalOpen?: (open: boolean) => void;
  setIsEditPositionModalOpen?: (open: boolean) => void;
  onViewDetails?: (position: Position) => void;
  onEdit?: (position: Position) => void;
  onDelete?: (position: Position) => void;
  departments?: Department[];
}

const positionColumns = ({
  setIsViewPositionModalOpen,
  setIsEditPositionModalOpen,
  onViewDetails,
  onEdit,
  onDelete,
  departments = [],
}: PositionColumnProps) => {
  const handleViewDetails = (position: Position) => {
    if (onViewDetails) {
      onViewDetails(position);
    }
    if (setIsViewPositionModalOpen) {
      setIsViewPositionModalOpen(true);
    }
  };

  const handleEdit = (position: Position) => {
    if (onEdit) {
      onEdit(position);
    }
    if (setIsEditPositionModalOpen) {
      setIsEditPositionModalOpen(true);
    }
  };

  const handleDelete = async (position: Position) => {
    if (onDelete) {
      onDelete(position);
    } else {
      toast.warning("Delete functionality not implemented yet");
    }
  }; // Component to display department name
  const DepartmentNameCell = ({ departmentId }: { departmentId: number }) => {
    const department = departments.find(
      (dept: Department) => dept.department_id === departmentId
    );

    return (
      <div className="flex items-center gap-2">
        <Building2 className="h-4 w-4 text-muted-foreground" />
        <span>{department?.name || `Dept ID: ${departmentId}`}</span>
      </div>
    );
  };

  return [
    {
      id: "position_id",
      accessorKey: "position_id",
      header: (info: any) => (
        <PositionHeaders info={info} name="ID" isNumber={true} />
      ),
      cell: (info: any) => info.getValue(),
    },
    {
      id: "title",
      accessorKey: "title",
      header: (info: any) => (
        <PositionHeaders info={info} name="Position Title" />
      ),
      cell: (info: any) => (
        <div className="flex items-center gap-2">
          <Briefcase className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">{info.getValue()}</span>
        </div>
      ),
    },
    {
      id: "department_name",
      accessorKey: "department_id",
      header: (info: any) => <PositionHeaders info={info} name="Department" />,
      cell: ({ getValue }: { getValue: () => number }) => (
        <DepartmentNameCell departmentId={getValue()} />
      ),
      filterFn: (row, columnId, filterValue) => {
        const departmentId = row.getValue(columnId) as number;
        const department = departments.find(
          (dept: Department) => dept.department_id === departmentId
        );
        const departmentName = department?.name || "";
        return departmentName.toLowerCase().includes(filterValue.toLowerCase());
      },
    },
    {
      id: "description",
      accessorKey: "description",
      header: (info: any) => <PositionHeaders info={info} name="Description" />,
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
        <PositionHeaders info={info} name="Created Date" />
      ),
      cell: (info: any) => {
        const date = info.getValue();
        return date ? new Date(date).toLocaleDateString() : "—";
      },
    },
    // Actions column
    {
      id: "actions",
      header: (info: any) => <PositionHeaders info={info} name="Actions" />,
      cell: ({ row }: { row: any }) => {
        const position = row.original;

        return (
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <EllipsisVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={() => handleViewDetails(position)}>
                  <Eye className="mr-2 h-4 w-4" />
                  View Details
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleEdit(position)}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit Position
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => handleDelete(position)}
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
  ] as ColumnDef<Position>[];
};

export default positionColumns;
