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
  MapPin,
  Calendar,
} from "lucide-react";
// import Modal from "@/components/modal";
// import FileOutOfBusinessContent from "@/components/modal-contents/file-out-of-business-content";
// import OutOfBusinessDetailsContent from "@/components/modal-contents/out-of-business-details-content";
import type { BaseRequest, RequestWithDetails } from "@/models/request-model";
import { fetchAllRequests, formatRequestDate } from "@/models/request-model";

const OutOfBusiness = () => {
  const [requests, setRequests] = useState<BaseRequest[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<BaseRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [_selectedRequest, setSelectedRequest] =
    useState<RequestWithDetails | null>(null);

  // Modal states
  // _ is for unused variables to avoid linting errors
  const [_isFileRequestOpen, _setIsFileRequestOpen] = useState(false);
  const [_isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [_detailsReadOnly, setDetailsReadOnly] = useState(false);

  useEffect(() => {
    fetchOutOfBusinessRequests();
  }, []);

  useEffect(() => {
    filterRequests();
  }, [requests, searchTerm, statusFilter]);

  const fetchOutOfBusinessRequests = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetchAllRequests({
        request_type: "out_of_business",
        page: 1,
        limit: 100,
      });

      if (response.success) {
        setRequests(response.data);
      } else {
        setError("Failed to fetch out of business requests");
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to fetch out of business requests"
      );
    } finally {
      setLoading(false);
    }
  };

  const filterRequests = () => {
    let filtered = requests;

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
          request.title?.toLowerCase().includes(searchTerm.toLowerCase())
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

  const handleViewDetails = (
    request: BaseRequest,
    readOnly: boolean = false
  ) => {
    setSelectedRequest(request as RequestWithDetails);
    setDetailsReadOnly(readOnly);
    setIsDetailsOpen(true);
  };

  // const handleFileRequestSuccess = () => {
  //   fetchOutOfBusinessRequests();
  // };

  // const handleApprovalSuccess = () => {
  //   fetchOutOfBusinessRequests();
  // };

  const getStats = () => {
    const total = requests.length;
    const pending = requests.filter((r) => r.status === "pending").length;
    const approved = requests.filter((r) => r.status === "approved").length;
    const rejected = requests.filter((r) => r.status === "rejected").length;
    const cancelled = requests.filter((r) => r.status === "cancelled").length;

    return { total, pending, approved, rejected, cancelled };
  };

  const stats = getStats();

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error}</p>
          <Button onClick={() => fetchOutOfBusinessRequests()}>
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-semibold">Out of Business Requests</h2>
          <p className="text-muted-foreground">
            Manage out of business requests and approvals
          </p>
        </div>
        <Button
          onClick={() => alert("Modal components not yet implemented")}
          className="flex items-center space-x-2"
        >
          <Plus className="h-4 w-4" />
          <span>File Out of Business Request</span>
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
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
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cancelled</CardTitle>
            <XCircle className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-600">
              {stats.cancelled}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by employee name, ID, or request title..."
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
            <DropdownMenuItem onClick={() => setStatusFilter("cancelled")}>
              Cancelled
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Out of Business Requests Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Destination</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Requested Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      Loading out of business requests...
                    </TableCell>
                  </TableRow>
                ) : filteredRequests.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      No out of business requests found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredRequests.map((request) => (
                    <TableRow key={request.request_id}>
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
                      <TableCell>
                        <div className="max-w-xs truncate">{request.title}</div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-1">
                          <MapPin className="h-3 w-3 text-muted-foreground" />
                          <span className="text-sm">
                            {request.description
                              ? request.description.split(" - ")[0]
                              : "Various"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {request.start_date && request.end_date
                            ? `${formatRequestDate(
                                request.start_date
                              )} - ${formatRequestDate(request.end_date)}`
                            : request.start_date
                            ? formatRequestDate(request.start_date)
                            : "N/A"}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-1">
                          <Calendar className="h-3 w-3 text-muted-foreground" />
                          <span className="text-sm">
                            {formatRequestDate(request.requested_date)}
                          </span>
                        </div>
                      </TableCell>
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

      {/* Modals - TODO: Create modal content components */}
      {/* 
      <Modal
        open={isFileRequestOpen}
        setOpen={setIsFileRequestOpen}
        title="File Out of Business Request"
        description="Submit a new out of business request"
      >
        <FileOutOfBusinessContent
          onSuccess={handleFileRequestSuccess}
          onClose={() => setIsFileRequestOpen(false)}
        />
      </Modal>

      <Modal
        open={isDetailsOpen}
        setOpen={setIsDetailsOpen}
        title={
          detailsReadOnly
            ? "Out of Business Request Details"
            : "Review Out of Business Request"
        }
        description="View and manage out of business request"
      >
        <OutOfBusinessDetailsContent
          request={selectedRequest}
          isReadOnly={detailsReadOnly}
          onSuccess={handleApprovalSuccess}
          onClose={() => setIsDetailsOpen(false)}
        />
      </Modal>
      */}
    </div>
  );
};

export default OutOfBusiness;
