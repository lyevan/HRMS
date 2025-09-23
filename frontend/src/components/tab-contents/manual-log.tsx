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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Plus,
  Search,
  MoreHorizontal,
  Eye,
  Clock,
  CheckCircle,
  XCircle,
  Filter,
  FileText,
  Calendar,
  Upload,
  Download,
} from "lucide-react";
import Modal from "@/components/modal";
import FileManualAttendanceContent from "@/components/modal-contents/file-manual-attendance-content";
import ManualLogDetailsContent from "@/components/modal-contents/manual-log-details-content";
import BulkUploadModal from "@/components/modals/bulk-upload-modal";
import type { BaseRequest } from "@/models/request-model";
import { fetchAllRequests, formatRequestDate } from "@/models/request-model";
import axios from "axios";
import { toast } from "sonner";

const ManualLog = () => {
  const [requests, setRequests] = useState<BaseRequest[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<BaseRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Modal states
  const [isFileManualLogOpen, setIsFileManualLogOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<BaseRequest | null>(
    null
  );
  const [isDetailsReadOnly, setIsDetailsReadOnly] = useState(false);
  const [isBulkUploadOpen, setIsBulkUploadOpen] = useState(false);

  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [results, setResults] = useState(null);

  useEffect(() => {
    fetchManualLogRequests();
  }, []);

  useEffect(() => {
    filterRequests();
  }, [requests, searchTerm, statusFilter]);

  const handleFileChange = (event: any) => {
    setFile(event.target.files[0]);
    setResults(null);
  };

  const handleUpload = async () => {
    if (!file) {
      alert("Please select a file");
      return;
    }

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("attendanceFile", file); // Must match multer field name

      const response = await axios.post("/attendance/bulk-excel", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      const result = response.data;
      setResults(result);

      if (result.success) {
        toast.success(
          `Success! ${result.data.successful_count} records processed`
        );
      } else {
        toast.warning(`Completed with ${result.data.error_count} errors`);
      }
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Failed to upload file. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  // Template download handlers
  const handleDownloadExcelTemplate = async () => {
    try {
      const response = await axios.get("/bulk-upload/template/excel", {
        responseType: "blob",
      });

      const blob = new Blob([response.data], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "attendance-upload-template.xlsx";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success("Excel template downloaded successfully");
    } catch (error) {
      console.error("Error downloading Excel template:", error);
      toast.error("Failed to download Excel template");
    }
  };

  const handleDownloadCSVTemplate = async () => {
    try {
      const response = await axios.get("/bulk-upload/template/csv", {
        responseType: "blob",
      });

      const blob = new Blob([response.data], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "attendance-upload-template.csv";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success("CSV template downloaded successfully");
    } catch (error) {
      console.error("Error downloading CSV template:", error);
      toast.error("Failed to download CSV template");
    }
  };

  const handleBulkUploadSuccess = () => {
    fetchManualLogRequests();
    // setIsBulkUploadOpen(false);
  };

  const fetchManualLogRequests = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetchAllRequests({
        request_type: "manual_log",
        page: 1,
        limit: 100,
      });

      if (response.success) {
        setRequests(response.data);
      } else {
        setError("Failed to fetch manual log requests");
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to fetch manual log requests"
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
    setSelectedRequest(request);
    setIsDetailsReadOnly(readOnly);
    setIsDetailsOpen(true);
  };

  const handleFileManualLogSuccess = () => {
    fetchManualLogRequests();
  };

  const handleApprovalSuccess = () => {
    fetchManualLogRequests();
    setIsDetailsOpen(false);
  };

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
          <Button onClick={() => fetchManualLogRequests()}>Try Again</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-semibold">Manual Log Requests</h2>
          <p className="text-muted-foreground">
            Manage manual attendance log requests and approvals
          </p>
        </div>
        {/* File Upload */}
        <div className="file-upload">
          <Input
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={handleFileChange}
            disabled={uploading}
          />
          <Button onClick={handleUpload} disabled={!file || uploading}>
            {uploading ? "Uploading..." : "Upload Attendance"}
          </Button>
        </div>
        <div className="flex gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger>
              <Button variant="outline">
                <Upload className="h-4 w-4 mr-2" />
                <span>Import from file</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => setIsBulkUploadOpen(true)}>
                <Upload className="h-4 w-4 mr-2" />
                <span>Upload CSV</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setIsBulkUploadOpen(true)}>
                <Upload className="h-4 w-4 mr-2" />
                <span>Upload Excel</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleDownloadCSVTemplate}>
                <Download className="h-4 w-4 mr-2" />
                <span>CSV Template</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleDownloadExcelTemplate}>
                <Download className="h-4 w-4 mr-2" />
                <span>Excel Template</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button
            onClick={() => setIsFileManualLogOpen(true)}
            className="flex items-center space-x-2"
          >
            <Plus className="h-4 w-4" />
            <span>File Manual Log Request</span>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Requests
            </CardTitle>
            <FileText className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pending}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
            <CheckCircle className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.approved}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rejected</CardTitle>
            <XCircle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.rejected}</div>
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

      {/* Manual Log Requests Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Target Date</TableHead>
                  <TableHead>Requested Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      Loading manual log requests...
                    </TableCell>
                  </TableRow>
                ) : filteredRequests.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      No manual log requests found
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
                          <Calendar className="h-3 w-3 text-muted-foreground" />
                          <span className="text-sm">
                            {request.start_date
                              ? formatRequestDate(request.start_date)
                              : "N/A"}
                          </span>
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

      {/* Modals */}
      <Modal
        open={isFileManualLogOpen}
        setOpen={setIsFileManualLogOpen}
        title="File Manual Log Request"
        description="Submit a new manual attendance log request"
        className="overflow-auto max-h-9/10"
      >
        <FileManualAttendanceContent
          onSuccess={handleFileManualLogSuccess}
          onClose={() => setIsFileManualLogOpen(false)}
          isAdminFiling={true}
        />
      </Modal>

      <Modal
        open={isDetailsOpen}
        setOpen={setIsDetailsOpen}
        title={
          isDetailsReadOnly
            ? "Manual Log Request Details"
            : "Review Manual Log Request"
        }
        description="View and manage manual log request"
        className="overflow-auto max-h-9/10"
      >
        <ManualLogDetailsContent
          request={selectedRequest}
          isReadOnly={isDetailsReadOnly}
          onSuccess={handleApprovalSuccess}
          onClose={() => setIsDetailsOpen(false)}
        />
      </Modal>

      {/* Bulk Upload Modal */}
      <BulkUploadModal
        isOpen={isBulkUploadOpen}
        onClose={() => setIsBulkUploadOpen(false)}
        onSuccess={handleBulkUploadSuccess}
      />
    </div>
  );
};

export default ManualLog;
