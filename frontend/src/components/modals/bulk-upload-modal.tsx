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
import BulkAttendancePreview from "@/components/bulk-attendance-preview";
import axios from "axios";
import { toast } from "sonner";

interface BulkUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface ProcessResult {
  success: boolean;
  message: string;
  sessionId?: string;
  totalRecords?: number;
  records?: any[];
  summary?: {
    employeesAffected: number;
    recordsWithTimeIn: number;
    recordsWithTimeOut: number;
    dayOffRecords: number;
    holidayRecords: number;
    presentRecords: number;
    absentRecords: number;
    leaveRecords: number;
  };
  warnings?: {
    employeesWithoutSchedule?: {
      count: number;
      employeeIds: string[];
      employees: Array<{
        employee_id: string;
        name: string;
        position: string;
      }>;
      message: string;
    };
    duplicateRecords?: {
      count: number;
      warnings: Array<{
        type: string;
        employee_id: string;
        date: string;
        attendance_id?: number;
        message: string;
        existing_data?: {
          is_present: boolean;
          is_absent: boolean;
          on_leave: boolean;
          time_in?: string;
          time_out?: string;
          total_hours?: number;
          created_at: string;
        };
        rows?: number[];
      }>;
      message: string;
      requiresConfirmation?: boolean;
    };
  };
  errors?: string[];
  missingEmployeeIds?: string[];
}

type UploadStep = "select" | "preview" | "completed";

export default function BulkUploadModal({
  isOpen,
  onClose,
  onSuccess,
}: BulkUploadModalProps) {
  const [currentStep, setCurrentStep] = useState<UploadStep>("select");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [processing, setProcessing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [processResult, setProcessResult] = useState<ProcessResult | null>(
    null
  );

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
      setProcessResult(null);
    }
  };

  const handleProcessFile = async () => {
    if (!selectedFile) {
      toast.error("Please select a file to process");
      return;
    }

    setProcessing(true);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append("attendanceFile", selectedFile);

      const response = await axios.post("/bulk-upload/process", formData, {
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

      setProcessResult(response.data);

      if (response.data.success) {
        toast.success(
          `File processed successfully. Found ${response.data.totalRecords} records.`
        );
        setCurrentStep("preview");
      }
    } catch (error: any) {
      console.error("Process error:", error);

      if (error.response?.data) {
        setProcessResult(error.response.data);
      } else {
        setProcessResult({
          success: false,
          message: "Failed to process file. Please try again.",
        });
      }

      toast.error(
        "Failed to process file. Please check the file and try again."
      );
    } finally {
      setProcessing(false);
    }
  };

  const handleSubmitRecords = async (
    records: any[],
    sessionId: string,
    overwriteExisting?: boolean
  ) => {
    setSubmitting(true);

    try {
      const response = await axios.post("/bulk-upload/submit", {
        records,
        sessionId,
        overwriteExisting,
      });

      if (response.data.success) {
        toast.success(
          `Successfully uploaded ${response.data.totalRecords} attendance records`
        );
        setCurrentStep("completed");
        onSuccess();
      }
    } catch (error: any) {
      console.error("Submit error:", error);

      // Handle duplicate confirmation case
      if (
        error.response?.status === 409 &&
        error.response?.data?.requiresConfirmation
      ) {
        // Update the processResult with duplicate warnings so the preview component can show confirmation
        if (processResult) {
          setProcessResult({
            ...processResult,
            warnings: {
              ...processResult.warnings,
              duplicateRecords: {
                count: error.response.data.duplicateWarnings?.length || 0,
                warnings: error.response.data.duplicateWarnings || [],
                message:
                  "Some records will overwrite existing attendance data in the database. Confirm to proceed.",
                requiresConfirmation: true,
              },
            },
          });
        }
        console.log("Duplicate records found, confirmation required");
      } else {
        toast.error("Failed to submit records. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setSelectedFile(null);
    setProcessResult(null);
    setUploadProgress(0);
    setCurrentStep("select");
    onClose();
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const renderStepIndicator = () => (
    <div className="flex items-center justify-center space-x-4 mb-6">
      <div
        className={`flex items-center space-x-2 ${
          currentStep === "select"
            ? "text-primary"
            : ["preview", "completed"].includes(currentStep)
            ? "text-green-600"
            : "text-muted-foreground"
        }`}
      >
        <div
          className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
            currentStep === "select"
              ? "border-primary bg-primary text-white"
              : ["preview", "completed"].includes(currentStep)
              ? "border-green-600 bg-green-600 text-white"
              : "border-muted-foreground"
          }`}
        >
          {["preview", "completed"].includes(currentStep) ? (
            <CheckCircle className="w-4 h-4" />
          ) : (
            "1"
          )}
        </div>
        <span className="text-sm font-medium">Select & Process File</span>
      </div>

      <div
        className={`w-8 h-1 ${
          ["preview", "completed"].includes(currentStep)
            ? "bg-green-600"
            : "bg-muted-foreground"
        }`}
      />

      <div
        className={`flex items-center space-x-2 ${
          currentStep === "preview"
            ? "text-primary"
            : currentStep === "completed"
            ? "text-green-600"
            : "text-muted-foreground"
        }`}
      >
        <div
          className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
            currentStep === "preview"
              ? "border-primary bg-primary text-white"
              : currentStep === "completed"
              ? "border-green-600 bg-green-600 text-white"
              : "border-muted-foreground"
          }`}
        >
          {currentStep === "completed" ? (
            <CheckCircle className="w-4 h-4" />
          ) : (
            "2"
          )}
        </div>
        <span className="text-sm font-medium">Preview & Submit</span>
      </div>
    </div>
  );

  return (
    <Modal
      open={isOpen}
      setOpen={handleClose}
      title="Bulk Upload Attendance Records"
      description="Upload attendance records from Excel or CSV files"
      className="sm:max-w-fit max-h-[90vh] overflow-y-auto"
    >
      <div className="space-y-6">
        {renderStepIndicator()}

        {currentStep === "select" && (
          <>
            {/* File Selection */}
            <div className="space-y-2">
              <Label htmlFor="file-upload">Select File</Label>
              <div className="flex items-center space-x-2">
                <Input
                  id="file-upload"
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={handleFileSelect}
                  disabled={processing}
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

            {/* Processing Progress */}
            {processing && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Processing file...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <Progress value={uploadProgress} className="w-full" />
              </div>
            )}

            {/* Process Results */}
            {processResult && !processResult.success && (
              <div className="space-y-4">
                <Alert variant="destructive">
                  <XCircle className="h-4 w-4" />
                  <AlertDescription>{processResult.message}</AlertDescription>
                </Alert>

                {processResult.errors && (
                  <div className="space-y-2">
                    <Alert variant="destructive">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        <strong>Validation Errors:</strong>
                      </AlertDescription>
                    </Alert>
                    <div className="max-h-40 overflow-y-auto bg-muted p-3 rounded text-sm">
                      {processResult.errors.map((error, index) => (
                        <div key={index} className="text-destructive">
                          {error}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {processResult.missingEmployeeIds && (
                  <div className="space-y-2">
                    <Alert variant="destructive">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        <strong>Missing Employee IDs:</strong>
                      </AlertDescription>
                    </Alert>
                    <div className="max-h-20 overflow-y-auto bg-muted p-3 rounded text-sm">
                      {processResult.missingEmployeeIds.join(", ")}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={handleClose}
                disabled={processing}
              >
                Cancel
              </Button>
              <Button
                onClick={handleProcessFile}
                disabled={!selectedFile || processing}
              >
                <Upload className="h-4 w-4 mr-2" />
                {processing ? "Processing..." : "Process File"}
              </Button>
            </div>
          </>
        )}

        {currentStep === "preview" && processResult?.success && (
          <BulkAttendancePreview
            records={processResult.records || []}
            summary={processResult.summary!}
            warnings={processResult.warnings}
            sessionId={processResult.sessionId!}
            onSubmit={handleSubmitRecords}
            onCancel={() => setCurrentStep("select")}
            isSubmitting={submitting}
          />
        )}

        {currentStep === "completed" && (
          <div className="text-center space-y-4">
            <CheckCircle className="w-16 h-16 text-green-600 mx-auto" />
            <h3 className="text-lg font-medium">
              Upload Completed Successfully!
            </h3>
            <p className="text-muted-foreground">
              {processResult?.totalRecords} attendance records have been
              uploaded to the database.
            </p>
            <Button onClick={handleClose}>Close</Button>
          </div>
        )}
      </div>
    </Modal>
  );
}
