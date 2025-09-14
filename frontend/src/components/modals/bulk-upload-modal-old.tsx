import { useState } from "react";
import Modal from "@/components/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Upload,
  FileText,
  CheckCircle,
  XCircle,
  AlertTriangle,
} from "lucide-react";
import axios from "axios";
import { toast } from "sonner";

interface BulkUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface UploadResult {
  success: boolean;
  message: string;
  totalRecords?: number;
  insertedRecords?: number;
  errors?: string[];
  missingEmployeeIds?: string[];
  summary?: {
    employeesAffected: number;
    recordsWithTimeIn: number;
    recordsWithTimeOut: number;
    dayOffRecords: number;
    holidayRecords: number;
  };
}

export default function BulkUploadModal({
  isOpen,
  onClose,
  onSuccess,
}: BulkUploadModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      const allowedTypes = [
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // .xlsx
        "application/vnd.ms-excel", // .xls
        "text/csv", // .csv
      ];

      if (!allowedTypes.includes(file.type)) {
        toast.error(
          "Invalid file type. Please upload Excel (.xlsx, .xls) or CSV files only."
        );
        return;
      }

      // Validate file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        toast.error(
          "File size too large. Please upload files smaller than 10MB."
        );
        return;
      }

      setSelectedFile(file);
      setUploadResult(null);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error("Please select a file to upload");
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append("attendanceFile", selectedFile);

      const response = await axios.post("/bulk-upload/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const percentCompleted = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            setUploadProgress(percentCompleted);
          }
        },
      });

      setUploadResult(response.data);

      if (response.data.success) {
        toast.success(
          `Successfully uploaded ${response.data.totalRecords} attendance records`
        );
        onSuccess();
      }
    } catch (error: any) {
      console.error("Upload error:", error);

      if (error.response?.data) {
        setUploadResult(error.response.data);
      } else {
        setUploadResult({
          success: false,
          message: "Upload failed. Please try again.",
        });
      }

      toast.error("Upload failed. Please check the file and try again.");
    } finally {
      setUploading(false);
    }
  };

  const handleClose = () => {
    setSelectedFile(null);
    setUploadResult(null);
    setUploadProgress(0);
    onClose();
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <Modal
      open={isOpen}
      setOpen={handleClose}
      title="Bulk Upload Attendance Records"
      description="Upload attendance records from Excel or CSV files"
      className="sm:max-w-2xl"
    >
      <div className="space-y-6">
        {/* File Selection */}
        <div className="space-y-2">
          <Label htmlFor="file-upload">Select File</Label>
          <div className="flex items-center space-x-2">
            <Input
              id="file-upload"
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileSelect}
              disabled={uploading}
              className="flex-1"
            />
          </div>
          {selectedFile && (
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <FileText className="h-4 w-4" />
              <span>{selectedFile.name}</span>
              <span>({formatFileSize(selectedFile.size)})</span>
            </div>
          )}
        </div>

        {/* Upload Progress */}
        {uploading && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Uploading...</span>
              <span>{uploadProgress}%</span>
            </div>
            <Progress value={uploadProgress} className="w-full" />
          </div>
        )}

        {/* Upload Results */}
        {uploadResult && (
          <div className="space-y-4">
            <Alert variant={uploadResult.success ? "default" : "destructive"}>
              <div className="flex items-center space-x-2">
                {uploadResult.success ? (
                  <CheckCircle className="h-4 w-4" />
                ) : (
                  <XCircle className="h-4 w-4" />
                )}
                <AlertDescription className="flex-1">
                  {uploadResult.message}
                </AlertDescription>
              </div>
            </Alert>

            {uploadResult.success && uploadResult.summary && (
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <strong>Upload Summary:</strong>
                  <ul className="mt-1 space-y-1 text-muted-foreground">
                    <li>• Total Records: {uploadResult.totalRecords}</li>
                    <li>
                      • Employees Affected:{" "}
                      {uploadResult.summary.employeesAffected}
                    </li>
                    <li>
                      • Records with Time In:{" "}
                      {uploadResult.summary.recordsWithTimeIn}
                    </li>
                    <li>
                      • Records with Time Out:{" "}
                      {uploadResult.summary.recordsWithTimeOut}
                    </li>
                  </ul>
                </div>
                <div>
                  <strong>Special Records:</strong>
                  <ul className="mt-1 space-y-1 text-muted-foreground">
                    <li>
                      • Day Off Records: {uploadResult.summary.dayOffRecords}
                    </li>
                    <li>
                      • Holiday Records: {uploadResult.summary.holidayRecords}
                    </li>
                  </ul>
                </div>
              </div>
            )}

            {!uploadResult.success && uploadResult.errors && (
              <div className="space-y-2">
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Validation Errors:</strong>
                  </AlertDescription>
                </Alert>
                <div className="max-h-40 overflow-y-auto bg-muted p-3 rounded text-sm">
                  {uploadResult.errors.map((error, index) => (
                    <div key={index} className="text-destructive">
                      {error}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {!uploadResult.success && uploadResult.missingEmployeeIds && (
              <div className="space-y-2">
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Missing Employee IDs:</strong>
                  </AlertDescription>
                </Alert>
                <div className="max-h-20 overflow-y-auto bg-muted p-3 rounded text-sm">
                  {uploadResult.missingEmployeeIds.join(", ")}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-end space-x-2">
          <Button variant="outline" onClick={handleClose} disabled={uploading}>
            {uploadResult?.success ? "Close" : "Cancel"}
          </Button>
          {!uploadResult?.success && (
            <Button
              onClick={handleUpload}
              disabled={!selectedFile || uploading}
            >
              <Upload className="h-4 w-4 mr-2" />
              {uploading ? "Uploading..." : "Upload"}
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
}
