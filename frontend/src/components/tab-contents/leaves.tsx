import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Plus,
  Search,
  MoreHorizontal,
  Eye,
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  Filter,
} from "lucide-react";
import Modal from "@/components/modal";
import FileLeaveContent from "@/components/modal-contents/file-leave-content";
import LeaveApprovalDetailsContent from "@/components/modal-contents/leave-approval-details-content";
import type { LeaveRequest } from "@/models/leave-model";
import { useLeaveStore } from "@/store/leaveStore";

const Leaves = () => {
  // Use store instead of local state
  const {
    leaveRequests,
    loading,
    error,
    fetchLeaveRequests,
    setSelectedRequest,
    selectedRequest,
  } = useLeaveStore();

  const [filteredRequests, setFilteredRequests] = useState<LeaveRequest[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Modal states
  const [isFileLeaveOpen, setIsFileLeaveOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [detailsReadOnly, setDetailsReadOnly] = useState(false);

  useEffect(() => {
    fetchLeaveRequests();
  }, [fetchLeaveRequests]);

  useEffect(() => {
    filterRequests();
  }, [leaveRequests, searchTerm, statusFilter]);

  const filterRequests = () => {
    let filtered = leaveRequests;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(
        (request) =>
          request.first_name
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          request.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          request.employee_id
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          request.leave_type_name
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase())
      );
    }

    // Filter by status
    if (statusFilter !== "all") {
      filtered = filtered.filter((request) => request.status === statusFilter);
    }

    setFilteredRequests(filtered);
  };

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
      month: "short",
      day: "numeric",
    });
  };

  const handleViewDetails = (
    request: LeaveRequest,
    readOnly: boolean = false
  ) => {
    setSelectedRequest(request);
    setDetailsReadOnly(readOnly);
    setIsDetailsOpen(true);
  };

  const handleFileLeaveSuccess = () => {
    fetchLeaveRequests();
  };

  const handleApprovalSuccess = () => {
    fetchLeaveRequests();
  };

  const getStats = () => {
    const total = leaveRequests.length;
    const pending = leaveRequests.filter((r) => r.status === "pending").length;
    const approved = leaveRequests.filter(
      (r) => r.status === "approved"
    ).length;
    const rejected = leaveRequests.filter(
      (r) => r.status === "rejected"
    ).length;

    return { total, pending, approved, rejected };
  };

  const stats = getStats();

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error}</p>
          <Button onClick={() => fetchLeaveRequests()}>Try Again</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-semibold">Leave Requests</h2>
          <p className="text-muted-foreground">
            Manage leave requests and approvals
          </p>
        </div>
        <Button
          onClick={() => setIsFileLeaveOpen(true)}
          className="flex items-center space-x-2"
        >
          <Plus className="h-4 w-4" />
          <span>File Leave Request</span>
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Requests
            </CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {stats.pending}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {stats.approved}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rejected</CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {stats.rejected}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by employee name, ID, or leave type..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="flex items-center space-x-2">
              <Filter className="h-4 w-4" />
              <span>
                Status: {statusFilter === "all" ? "All" : statusFilter}
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => setStatusFilter("all")}>
              All
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setStatusFilter("pending")}>
              Pending
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setStatusFilter("approved")}>
              Approved
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setStatusFilter("rejected")}>
              Rejected
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Leave Requests Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Leave Type</TableHead>
                  <TableHead>Start Date</TableHead>
                  <TableHead>End Date</TableHead>
                  <TableHead>Days</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      Loading leave requests...
                    </TableCell>
                  </TableRow>
                ) : filteredRequests.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      No leave requests found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredRequests.map((request) => (
                    <TableRow key={request.leave_request_id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            {request.first_name} {request.last_name}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {request.employee_id}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{request.leave_type_name}</TableCell>
                      <TableCell>{formatDate(request.start_date)}</TableCell>
                      <TableCell>{formatDate(request.end_date)}</TableCell>
                      <TableCell>{request.days_requested}</TableCell>
                      <TableCell>{getStatusBadge(request.status)}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => handleViewDetails(request, true)}
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            {request.status === "pending" && (
                              <DropdownMenuItem
                                onClick={() =>
                                  handleViewDetails(request, false)
                                }
                              >
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Review & Approve
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Modals */}
      <Modal
        open={isFileLeaveOpen}
        setOpen={setIsFileLeaveOpen}
        title="File Leave Request"
        description="Submit a new leave request"
      >
        <FileLeaveContent
          onSuccess={handleFileLeaveSuccess}
          onClose={() => setIsFileLeaveOpen(false)}
          isAdminFiling={true}
        />
      </Modal>

      <Modal
        open={isDetailsOpen}
        setOpen={setIsDetailsOpen}
        title={
          detailsReadOnly ? "Leave Request Details" : "Review Leave Request"
        }
        description="View and manage leave request"
      >
        <LeaveApprovalDetailsContent
          leaveRequest={selectedRequest}
          isReadOnly={detailsReadOnly}
          onSuccess={handleApprovalSuccess}
          onClose={() => setIsDetailsOpen(false)}
        />
      </Modal>
    </div>
  );
};

export default Leaves;
