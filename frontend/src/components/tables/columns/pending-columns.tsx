import { createColumnHelper } from "@tanstack/react-table";
import PendingEmployeeHeaders from "../headers/pending-headers";
import { type PendingEmployee } from "@/models/pending-employee-model";
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
  UserCheck,
  UserX,
  Mail,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  useReviewPendingEmployee,
  useApprovePendingEmployee,
  useRejectPendingEmployee,
} from "@/store/pendingEmployeeStore";
import { toast } from "sonner";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

const columnHelper = createColumnHelper<PendingEmployee>();

const pendingEmployeeColumns = (
  setIsViewPendingEmployeeModalOpen?: (open: boolean) => void,
  onViewDetails?: (employee: PendingEmployee) => void
) => {
  const reviewPendingEmployee = useReviewPendingEmployee();
  const approvePendingEmployee = useApprovePendingEmployee();
  const rejectPendingEmployee = useRejectPendingEmployee();

  // Modal state
  const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] =
    useState<PendingEmployee | null>(null);
  const [selectedRole, setSelectedRole] = useState<string>("admin");

  const handleViewDetails = (employee: PendingEmployee) => {
    if (onViewDetails) {
      onViewDetails(employee);
    }
    if (setIsViewPendingEmployeeModalOpen) {
      setIsViewPendingEmployeeModalOpen(true);
    }
  };

  const handleReview = async (employee: PendingEmployee) => {
    try {
      await reviewPendingEmployee(employee.pending_employee_id);
      toast.success("Employee marked as reviewed");
    } catch (error: any) {
      toast.error(error.response.data.error || "Failed to review employee");
    }
  };

  const handleApprove = (employee: PendingEmployee) => {
    setSelectedEmployee(employee);
    setSelectedRole("admin"); // Default to admin
    setIsApproveModalOpen(true);
  };

  const handleConfirmApprove = async () => {
    if (!selectedEmployee) return;

    try {
      await approvePendingEmployee(selectedEmployee, selectedRole);
      toast.success("Employee approved successfully");
      setIsApproveModalOpen(false);
      setSelectedEmployee(null);
    } catch (error) {
      toast.error("Failed to approve employee");
    }
  };

  const handleReject = async (employee: PendingEmployee) => {
    try {
      await rejectPendingEmployee(employee.pending_employee_id);
      toast.success("Employee rejected");
    } catch (error) {
      toast.error("Failed to reject employee");
    }
  };

  return {
    columns: [
      columnHelper.accessor((row) => `${row.first_name} ${row.last_name}`, {
        id: "full_name",
        header: (info) => (
          <PendingEmployeeHeaders info={info} name="Full Name" />
        ),
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
        header: (info) => <PendingEmployeeHeaders info={info} name="Email" />,
        cell: (info) => info.getValue(),
      }),
      columnHelper.accessor(
        (row) => `${row.department_name || ""} - ${row.position_title || ""}`,
        {
          id: "department_position",
          header: (info) => (
            <PendingEmployeeHeaders info={info} name="Department & Position" />
          ),
          cell: (info) => (
            <div className="flex flex-col">
              <p className="font-medium">
                {info.row.original.department_name || "--"}
              </p>
              <p className="text-sm text-muted-foreground">
                {info.row.original.position_title || "--"}
              </p>
            </div>
          ),
          sortingFn: (rowA, rowB) => {
            const deptA = rowA.original.department_name || "";
            const deptB = rowB.original.department_name || "";
            return deptA.localeCompare(deptB);
          },
          filterFn: (row, _columnId, filterValue) => {
            const combined = `${row.original.department_name || ""} ${
              row.original.position_title || ""
            }`;
            return combined.toLowerCase().includes(filterValue.toLowerCase());
          },
        }
      ),
      columnHelper.accessor("status", {
        header: (info) => <PendingEmployeeHeaders info={info} name="Status" />,
        cell: (info) => {
          const status = info.getValue();
          const getStatusColor = (status: string) => {
            switch (status?.toLowerCase()) {
              case "pending":
                return "bg-yellow-100 text-yellow-800";
              case "registering":
                return "bg-blue-100 text-blue-800";
              case "for reviewing":
                return "bg-orange-100 text-orange-800";
              case "for approval":
                return "bg-purple-100 text-purple-800";
              case "approved":
                return "bg-green-100 text-green-800";
              case "rejected":
                return "bg-red-100 text-red-800";
              default:
                return "bg-gray-100 text-gray-800";
            }
          };

          return (
            <span
              className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                status
              )}`}
            >
              {status?.charAt(0).toUpperCase() + status?.slice(1)}
            </span>
          );
        },
      }), //   More actions column
      columnHelper.display({
        id: "actions",
        header: (info) => <PendingEmployeeHeaders info={info} name="Actions" />,
        cell: ({ row }) => {
          const employee = row.original;
          const canReview = employee.status === "for reviewing";
          const canApprove = employee.status === "for approval";
          const canReject =
            employee.status !== "approved" && employee.status !== "rejected";

          return (
            <div className="flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size={"icon"}>
                    <EllipsisVertical />
                  </Button>
                </DropdownMenuTrigger>{" "}
                <DropdownMenuContent
                  onCloseAutoFocus={(e) => e.preventDefault()}
                >
                  <DropdownMenuItem onClick={() => handleViewDetails(employee)}>
                    <Eye className="mr-2 h-4 w-4" />
                    View Details
                  </DropdownMenuItem>
                  <DropdownMenuItem disabled onClick={() => {}}>
                    <Mail className="mr-2 h-4 w-4" />
                    Send Email
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  {canReview && (
                    <DropdownMenuItem onClick={() => handleReview(employee)}>
                      <FileText className="mr-2 h-4 w-4" />
                      Mark as Reviewed
                    </DropdownMenuItem>
                  )}
                  {canApprove && (
                    <DropdownMenuItem onClick={() => handleApprove(employee)}>
                      <UserCheck className="mr-2 h-4 w-4" />
                      Approve
                    </DropdownMenuItem>
                  )}
                  {canReject && (
                    <DropdownMenuItem
                      onClick={() => handleReject(employee)}
                      className="text-red-600"
                    >
                      <UserX className="mr-2 h-4 w-4" />
                      Reject
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          );
        },
      }),
    ],
    approveModal: (
      <Dialog open={isApproveModalOpen} onOpenChange={setIsApproveModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Approve Employee</DialogTitle>
            <DialogDescription>
              Select the role for{" "}
              {selectedEmployee
                ? `${selectedEmployee.first_name} ${selectedEmployee.last_name}`
                : "the employee"}{" "}
              and confirm approval.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="role" className="text-right">
                Role
              </Label>
              <Select value={selectedRole} onValueChange={setSelectedRole}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="employee">Employee</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsApproveModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="button" onClick={handleConfirmApprove}>
              Approve Employee
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    ),
  };
};

export default pendingEmployeeColumns;
