import { useState, useEffect } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Clock,
  FileText,
  User,
  CheckCircle,
  XCircle,
  MessageSquare,
  Timer,
} from "lucide-react";
import { toast } from "sonner";
import type { RequestWithDetails } from "@/models/request-model";
import {
  approveRequest,
  rejectRequest,
  fetchRequestDetails,
} from "@/models/request-model";
import LabelAndInput from "../label-input-readonly";
import { useUserSessionStore } from "@/store/userSessionStore";

interface ManualLogDetailsContentProps {
  request: RequestWithDetails | null;
  onClose: () => void;
  onSuccess: () => void;
  isReadOnly?: boolean;
}

const ManualLogDetailsContent = ({
  request,
  onClose,
  onSuccess,
  isReadOnly = false,
}: ManualLogDetailsContentProps) => {
  const [isApproving, setIsApproving] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [requestDetails, setRequestDetails] =
    useState<RequestWithDetails | null>(request);

  const { employee } = useUserSessionStore();

  const methods = useForm({
    defaultValues: {
      rejectionReason: "",
    },
  });

  const { register, watch } = methods;
  const rejectionReason = watch("rejectionReason");

  // Fetch detailed request data if not available
  useEffect(() => {
    const fetchDetails = async () => {
      if (request && !request.specific_data) {
        try {
          const details = await fetchRequestDetails(request.request_id);
          setRequestDetails(details);
        } catch (error) {
          console.error("Error fetching request details:", error);
        }
      }
    };
    fetchDetails();
  }, [request]);

  if (!requestDetails) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">
          No manual log request data available.
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
      case "cancelled":
        return (
          <Badge variant="outline" className="text-gray-600 border-gray-600">
            <XCircle className="h-3 w-3 mr-1" />
            Cancelled
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

  const formatTime = (timeString: string) => {
    try {
      if (timeString.includes("T")) {
        return new Date(timeString).toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
        });
      } else {
        return new Date(`2000-01-01T${timeString}`).toLocaleTimeString(
          "en-US",
          {
            hour: "2-digit",
            minute: "2-digit",
          }
        );
      }
    } catch {
      return timeString;
    }
  };

  const handleApprove = async () => {
    if (!employee?.employee_id) {
      toast.error("Unable to identify approver. Please log in again.");
      return;
    }

    setIsApproving(true);
    try {
      await approveRequest(requestDetails.request_id, employee.employee_id);
      toast.success("Manual log request approved successfully");
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error("Error approving manual log request:", error);
      toast.error(error.message || "Failed to approve manual log request");
    } finally {
      setIsApproving(false);
    }
  };

  const handleReject = async () => {
    if (!employee?.employee_id) {
      toast.error("Unable to identify rejector. Please log in again.");
      return;
    }

    if (!rejectionReason.trim()) {
      toast.error("Please provide a reason for rejection");
      return;
    }

    setIsRejecting(true);
    try {
      await rejectRequest(
        requestDetails.request_id,
        employee.employee_id,
        rejectionReason.trim()
      );
      toast.success("Manual log request rejected");
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error("Error rejecting manual log request:", error);
      toast.error(error.message || "Failed to reject manual log request");
    } finally {
      setIsRejecting(false);
    }
  };

  const manualLogData = requestDetails.specific_data as any;

  return (
    <FormProvider {...methods}>
      <div className="space-y-6 max-h-[70vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <FileText className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold">
              Manual Log Request Details
            </h3>
          </div>
          {getStatusBadge(requestDetails.status)}
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
              displayValue={requestDetails.employee_id}
              isReadOnly={true}
              excludeFromForm={true}
            />
            <LabelAndInput
              name="employee_name"
              label="Employee Name"
              displayValue={`${requestDetails.first_name || ""} ${
                requestDetails.last_name || ""
              }`}
              isReadOnly={true}
              excludeFromForm={true}
            />
          </div>
        </div>

        <Separator />

        {/* Request Information */}
        <div className="space-y-4">
          <h4 className="text-md font-medium flex items-center space-x-2">
            <FileText className="h-4 w-4" />
            <span>Request Information</span>
          </h4>

          <div className="grid grid-cols-1 gap-4">
            <LabelAndInput
              name="title"
              label="Request Title"
              displayValue={requestDetails.title}
              isReadOnly={true}
              excludeFromForm={true}
            />
            <div className="space-y-2">
              <Label>Description</Label>
              <div className="p-3 border rounded-md bg-muted/50">
                <p className="text-sm">
                  {requestDetails.description || "No description provided"}
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <LabelAndInput
              name="requested_date"
              label="Date Requested"
              displayValue={formatDate(requestDetails.requested_date)}
              isReadOnly={true}
              excludeFromForm={true}
            />
            <LabelAndInput
              name="request_id"
              label="Request ID"
              displayValue={`#${requestDetails.request_id
                .toString()
                .padStart(4, "0")}`}
              isReadOnly={true}
              excludeFromForm={true}
            />
          </div>
        </div>

        <Separator />

        {/* Manual Log Details */}
        <div className="space-y-4">
          <h4 className="text-md font-medium flex items-center space-x-2">
            <Timer className="h-4 w-4" />
            <span>Manual Log Details</span>
          </h4>

          <div className="grid grid-cols-2 gap-4">
            <LabelAndInput
              name="target_date"
              label="Target Date"
              displayValue={
                manualLogData?.target_date
                  ? formatDate(manualLogData.target_date)
                  : "N/A"
              }
              isReadOnly={true}
              excludeFromForm={true}
            />
            <div />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {manualLogData?.time_in && (
              <LabelAndInput
                name="time_in"
                label="Time In"
                displayValue={formatTime(manualLogData.time_in)}
                isReadOnly={true}
                excludeFromForm={true}
              />
            )}
            {manualLogData?.time_out && (
              <LabelAndInput
                name="time_out"
                label="Time Out"
                displayValue={formatTime(manualLogData.time_out)}
                isReadOnly={true}
                excludeFromForm={true}
              />
            )}
          </div>

          {/* Shift and Break Information */}
          <div className="grid grid-cols-3 gap-4">
            {manualLogData?.shift_start_time && (
              <LabelAndInput
                name="shift_start_time"
                label="Shift Start"
                displayValue={formatTime(manualLogData.shift_start_time)}
                isReadOnly={true}
                excludeFromForm={true}
              />
            )}
            {manualLogData?.shift_end_time && (
              <LabelAndInput
                name="shift_end_time"
                label="Shift End"
                displayValue={formatTime(manualLogData.shift_end_time)}
                isReadOnly={true}
                excludeFromForm={true}
              />
            )}
            {manualLogData?.break_duration && (
              <LabelAndInput
                name="break_duration"
                label="Break Duration"
                displayValue={`${manualLogData.break_duration} minutes`}
                isReadOnly={true}
                excludeFromForm={true}
              />
            )}
          </div>

          {/* Calculated Hours */}
          {(manualLogData?.total_hours || manualLogData?.overtime_hours) && (
            <div className="grid grid-cols-2 gap-4">
              {manualLogData?.total_hours && (
                <div className="space-y-2">
                  <Label>Total Hours Worked</Label>
                  <div className="p-3 border rounded-md bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
                    <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                      {parseFloat(manualLogData.total_hours).toFixed(2)} hours
                    </p>
                  </div>
                </div>
              )}
              {manualLogData?.overtime_hours &&
                parseFloat(manualLogData.overtime_hours) > 0 && (
                  <div className="space-y-2">
                    <Label>Overtime Hours</Label>
                    <div className="p-3 border rounded-md bg-orange-50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-800">
                      <p className="text-sm font-medium text-orange-900 dark:text-orange-100">
                        {parseFloat(manualLogData.overtime_hours).toFixed(2)}{" "}
                        hours
                      </p>
                    </div>
                  </div>
                )}
            </div>
          )}

          {manualLogData?.reason && (
            <div className="space-y-2">
              <Label>Reason for Manual Log</Label>
              <div className="p-3 border rounded-md bg-muted/50">
                <p className="text-sm">{manualLogData.reason}</p>
              </div>
            </div>
          )}

          {manualLogData?.supporting_documents &&
            manualLogData.supporting_documents.length > 0 && (
              <div className="space-y-2">
                <Label>Supporting Documents</Label>
                <div className="p-3 border rounded-md bg-muted/50">
                  <ul className="text-sm space-y-1">
                    {manualLogData.supporting_documents.map(
                      (doc: string, index: number) => (
                        <li key={index}>• {doc}</li>
                      )
                    )}
                  </ul>
                </div>
              </div>
            )}
        </div>

        {/* Approval History */}
        {(requestDetails.status === "approved" ||
          requestDetails.status === "rejected") && (
          <>
            <Separator />
            <div className="space-y-4">
              <h4 className="text-md font-medium flex items-center space-x-2">
                <MessageSquare className="h-4 w-4" />
                <span>Approval History</span>
              </h4>

              {requestDetails.status === "approved" && (
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-4">
                    <LabelAndInput
                      name="approved_by"
                      label="Approved By"
                      displayValue={
                        requestDetails.approved_by_first_name &&
                        requestDetails.approved_by_last_name
                          ? `${requestDetails.approved_by_first_name} ${requestDetails.approved_by_last_name}`
                          : requestDetails.approved_by || "N/A"
                      }
                      isReadOnly={true}
                      excludeFromForm={true}
                    />
                    <LabelAndInput
                      name="approved_date"
                      label="Approved Date"
                      displayValue={
                        requestDetails.approved_date
                          ? formatDate(requestDetails.approved_date)
                          : "N/A"
                      }
                      isReadOnly={true}
                      excludeFromForm={true}
                    />
                  </div>
                </div>
              )}

              {requestDetails.status === "rejected" && (
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-4">
                    <LabelAndInput
                      name="rejected_by"
                      label="Rejected By"
                      displayValue={
                        requestDetails.rejected_by_first_name &&
                        requestDetails.rejected_by_last_name
                          ? `${requestDetails.rejected_by_first_name} ${requestDetails.rejected_by_last_name}`
                          : requestDetails.rejected_by || "N/A"
                      }
                      isReadOnly={true}
                      excludeFromForm={true}
                    />
                    <LabelAndInput
                      name="rejected_date"
                      label="Rejected Date"
                      displayValue={
                        requestDetails.rejected_date
                          ? formatDate(requestDetails.rejected_date)
                          : "N/A"
                      }
                      isReadOnly={true}
                      excludeFromForm={true}
                    />
                  </div>
                  {requestDetails.rejection_reason && (
                    <div className="space-y-2">
                      <Label>Rejection Reason</Label>
                      <div className="p-3 border rounded-md bg-red-50 border-red-200">
                        <p className="text-sm text-red-800">
                          {requestDetails.rejection_reason}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </>
        )}

        {/* Action Buttons */}
        {!isReadOnly && requestDetails.status === "pending" && (
          <>
            <Separator />
            <div className="space-y-4">
              <h4 className="text-md font-medium">Review Action</h4>

              <div className="space-y-2">
                <Label htmlFor="rejectionReason">
                  Rejection Reason (Required for rejection)
                </Label>
                <Textarea
                  id="rejectionReason"
                  placeholder="Please provide a reason if rejecting this request..."
                  {...register("rejectionReason")}
                />
              </div>

              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  disabled={isApproving || isRejecting}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  onClick={handleReject}
                  disabled={isApproving || isRejecting}
                  className="flex items-center space-x-2"
                >
                  {isRejecting ? (
                    <>
                      <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                      <span>Rejecting...</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="h-4 w-4" />
                      <span>Reject</span>
                    </>
                  )}
                </Button>
                <Button
                  type="button"
                  onClick={handleApprove}
                  disabled={isApproving || isRejecting}
                  className="flex items-center space-x-2"
                >
                  {isApproving ? (
                    <>
                      <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                      <span>Approving...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4" />
                      <span>Approve</span>
                    </>
                  )}
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </FormProvider>
  );
};

export default ManualLogDetailsContent;
