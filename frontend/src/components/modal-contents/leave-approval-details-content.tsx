import { useState } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Calendar,
  FileText,
  User,
  Clock,
  CheckCircle,
  XCircle,
  MessageSquare,
} from "lucide-react";
import { toast } from "sonner";
import axios from "axios";
import type { LeaveRequest } from "@/models/leave-model";
import LabelAndInput from "../label-input-readonly";
import { useUserSessionStore } from "@/store/userSessionStore";

interface LeaveApprovalDetailsContentProps {
  leaveRequest: LeaveRequest | null;
  onClose: () => void;
  onSuccess: () => void;
  isReadOnly?: boolean;
}

const LeaveApprovalDetailsContent = ({
  leaveRequest,
  onClose,
  onSuccess,
  isReadOnly = false,
}: LeaveApprovalDetailsContentProps) => {
  const [isApproving, setIsApproving] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);

  const { employee } = useUserSessionStore();

  const methods = useForm({
    defaultValues: {
      comments: "",
    },
  });

  const { register, watch } = methods;
  const comments = watch("comments");

  if (!leaveRequest) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">
          No leave request data available.
        </p>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <Badge
            variant="outline"
            className="text-yellow-600 border-yellow-600"
          >
            <Clock className="h-3 w-3 mr-1" />
            Pending
          </Badge>
        );
      case "approved":
        return (
          <Badge variant="outline" className="text-green-600 border-green-600">
            <CheckCircle className="h-3 w-3 mr-1" />
            Approved
          </Badge>
        );
      case "rejected":
        return (
          <Badge variant="outline" className="text-red-600 border-red-600">
            <XCircle className="h-3 w-3 mr-1" />
            Rejected
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const handleApprove = async () => {
    setIsApproving(true);
    try {
      await axios.patch(
        `/leave/requests/${leaveRequest.leave_request_id}/approve`,
        {
          approved_by: employee?.employee_id, // This should be from auth context
          comments: comments || undefined,
        }
      );
      toast.success("Leave request approved successfully");
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error("Error approving leave request:", error);
      toast.error(
        error.response?.data?.message || "Failed to approve leave request"
      );
    } finally {
      setIsApproving(false);
    }
  };

  const handleReject = async () => {
    setIsRejecting(true);
    try {
      await axios.patch(
        `/leave/requests/${leaveRequest.leave_request_id}/reject`,
        {
          rejected_by: employee?.employee_id, // This should be from auth context
          comments: comments || "No reason provided",
        }
      );
      toast.success("Leave request rejected");
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error("Error rejecting leave request:", error);
      toast.error(
        error.response?.data?.message || "Failed to reject leave request"
      );
    } finally {
      setIsRejecting(false);
    }
  };

  return (
    <FormProvider {...methods}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <FileText className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold">Leave Request Details</h3>
          </div>
          {getStatusBadge(leaveRequest.status)}
        </div>

        {/* Employee Information */}
        <div className="space-y-4">
          <h4 className="text-md font-medium flex items-center space-x-2">
            <User className="h-4 w-4" />
            <span>Employee Information</span>
          </h4>

          <div className="grid grid-cols-2 gap-4">
            <LabelAndInput
              name="employee_id"
              label="Employee ID"
              displayValue={leaveRequest.employee_id}
              isReadOnly={true}
              excludeFromForm={true}
            />
            <LabelAndInput
              name="employee_name"
              label="Employee Name"
              displayValue={`${leaveRequest.first_name || ""} ${
                leaveRequest.last_name || ""
              }`}
              isReadOnly={true}
              excludeFromForm={true}
            />
          </div>
        </div>

        <Separator />

        {/* Leave Details */}
        <div className="space-y-4">
          <h4 className="text-md font-medium flex items-center space-x-2">
            <Calendar className="h-4 w-4" />
            <span>Leave Details</span>
          </h4>

          <div className="grid grid-cols-2 gap-4">
            <LabelAndInput
              name="leave_type"
              label="Leave Type"
              displayValue={leaveRequest.leave_type_name || "N/A"}
              isReadOnly={true}
              excludeFromForm={true}
            />
            <LabelAndInput
              name="days_requested"
              label="Days Requested"
              displayValue={leaveRequest.days_requested?.toString() || "0"}
              isReadOnly={true}
              excludeFromForm={true}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <LabelAndInput
              name="start_date"
              label="Start Date"
              displayValue={formatDate(leaveRequest.start_date)}
              isReadOnly={true}
              excludeFromForm={true}
            />
            <LabelAndInput
              name="end_date"
              label="End Date"
              displayValue={formatDate(leaveRequest.end_date)}
              isReadOnly={true}
              excludeFromForm={true}
            />
          </div>

          <div className="space-y-2">
            <Label>Reason</Label>
            <div className="p-3 bg-muted rounded-md">
              <p className="text-sm">
                {leaveRequest.reason || "No reason provided"}
              </p>
            </div>
          </div>
        </div>

        <Separator />

        {/* Request Information */}
        <div className="space-y-4">
          <h4 className="text-md font-medium flex items-center space-x-2">
            <Clock className="h-4 w-4" />
            <span>Request Information</span>
          </h4>

          <div className="grid grid-cols-2 gap-4">
            <LabelAndInput
              name="request_date"
              label="Request Date"
              displayValue={formatDate(leaveRequest.created_at)}
              isReadOnly={true}
              excludeFromForm={true}
            />
            <LabelAndInput
              name="status"
              label="Status"
              displayValue={
                leaveRequest.status.charAt(0).toUpperCase() +
                leaveRequest.status.slice(1)
              }
              isReadOnly={true}
              excludeFromForm={true}
            />
          </div>

          {leaveRequest.approved_date && (
            <div className="grid grid-cols-2 gap-4">
              <LabelAndInput
                name="approval_date"
                label="Approval Date"
                displayValue={formatDate(leaveRequest.approved_date)}
                isReadOnly={true}
                excludeFromForm={true}
              />
              <LabelAndInput
                name="approver_name"
                label="Approved By"
                displayValue={leaveRequest.approver_name || "N/A"}
                isReadOnly={true}
                excludeFromForm={true}
              />
            </div>
          )}

          {leaveRequest.comments && (
            <div className="space-y-2">
              <Label>Approver Comments</Label>
              <div className="p-3 bg-muted rounded-md">
                <p className="text-sm">{leaveRequest.comments}</p>
              </div>
            </div>
          )}
        </div>

        {/* Approval Section (only for pending requests and not read-only) */}
        {leaveRequest.status === "pending" && !isReadOnly && (
          <>
            <Separator />
            <div className="space-y-4">
              <h4 className="text-md font-medium flex items-center space-x-2">
                <MessageSquare className="h-4 w-4" />
                <span>Approval Decision</span>
              </h4>

              <div className="space-y-2">
                <Label htmlFor="comments">Comments (Optional)</Label>
                <Textarea
                  id="comments"
                  placeholder="Add any comments for this decision..."
                  rows={3}
                  {...register("comments")}
                />
              </div>

              <div className="flex justify-between">
                <Button
                  type="button"
                  variant="destructive"
                  onClick={handleReject}
                  disabled={isRejecting || isApproving}
                  className="flex items-center space-x-2"
                >
                  <XCircle className="h-4 w-4" />
                  <span>{isRejecting ? "Rejecting..." : "Reject"}</span>
                </Button>

                <Button
                  type="button"
                  onClick={handleApprove}
                  disabled={isApproving || isRejecting}
                  className="flex items-center space-x-2"
                >
                  <CheckCircle className="h-4 w-4" />
                  <span>{isApproving ? "Approving..." : "Approve"}</span>
                </Button>
              </div>
            </div>
          </>
        )}

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3 pt-4">
          <Button type="button" variant="outline" onClick={onClose}>
            {isReadOnly || leaveRequest.status !== "pending"
              ? "Close"
              : "Cancel"}
          </Button>
        </div>
      </div>
    </FormProvider>
  );
};

export default LeaveApprovalDetailsContent;
