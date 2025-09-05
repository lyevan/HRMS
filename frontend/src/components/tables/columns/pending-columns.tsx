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

const columnHelper = createColumnHelper<PendingEmployee>();

const pendingEmployeeColumns = (
  setIsViewPendingEmployeeModalOpen?: (open: boolean) => void,
  onViewDetails?: (employee: PendingEmployee) => void
) => {
  const reviewPendingEmployee = useReviewPendingEmployee();
  const approvePendingEmployee = useApprovePendingEmployee();
  const rejectPendingEmployee = useRejectPendingEmployee();

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

  const handleApprove = async (employee: PendingEmployee) => {
    try {
      // For now, default to "admin" role
      await approvePendingEmployee(employee, "admin");
      toast.success("Employee approved successfully");
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

  return [
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
    columnHelper.accessor("email", {
      header: (info) => <PendingEmployeeHeaders info={info} name="Email" />,
      cell: (info) => info.getValue(),
    }),
    columnHelper.accessor("department_name", {
      header: (info) => (
        <PendingEmployeeHeaders info={info} name="Department" />
      ),
      cell: (info) => info.getValue() || "--",
    }),
    columnHelper.accessor("position_title", {
      header: (info) => <PendingEmployeeHeaders info={info} name="Position" />,
      cell: (info) => info.getValue() || "--",
    }),
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
              <DropdownMenuContent onCloseAutoFocus={(e) => e.preventDefault()}>
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
  ];
};

export default pendingEmployeeColumns;
