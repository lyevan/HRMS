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

interface ProcessResult {
  success: boolean;
  message: string;
  sessionId?: string;
  totalRecords?: number;
  records?: any[];
  data?: {
    successful_count?: number;
    error_count?: number;
    errors?: string[];
  };
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

type UploadStep = "select" | "completed";

export default function BulkUploadModal({
  isOpen,
  onClose,
  onSuccess,
}: BulkUploadModalProps) {
  const [currentStep, setCurrentStep] = useState<UploadStep>("select");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [processing, setProcessing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [processResult, setProcessResult] = useState<ProcessResult | null>(
    null
  );

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type - Excel only
      const allowedTypes = [
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // .xlsx
        "application/vnd.ms-excel", // .xls
      ];

      if (!allowedTypes.includes(file.type)) {
        toast.error(
          "Invalid file type. Please upload Excel (.xlsx, .xls) files only."
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

  const handleUploadFile = async () => {
    if (!selectedFile) {
      toast.error("Please select a file to upload");
      return;
    }

    setProcessing(true);
    setUploadProgress(0);

    const uploadPromise = new Promise(async (resolve, reject) => {
      try {
        const formData = new FormData();
        formData.append("attendanceFile", selectedFile);

        const response = await axios.post("/attendance/bulk-excel", formData, {
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

        const result = response.data;
        setProcessResult(result);

        if (result.success) {
          setCurrentStep("completed");
          onSuccess();
          resolve(result);
        } else {
          setCurrentStep("completed");
          // Don't reject, resolve with result so success callback can handle it
          resolve(result);
        }
      } catch (error: any) {
        console.error("Upload error:", error);
        setProcessResult({
          success: false,
          message: "Failed to upload file. Please try again.",
          errors: [error.message],
        });
        reject(error);
      } finally {
        setProcessing(false);
      }
    });

    toast.promise(uploadPromise, {
      loading: "Uploading attendance file...",
      success: (result: any) => {
        if (result.success) {
          return `Success! ${result.data.successful_count} records processed successfully`;
        } else {
          return `Upload completed with ${result.data.error_count} errors. Check the details below.`;
        }
      },
      error: (error: any) => {
        const errorMessage =
          error?.response?.data?.message ||
          error?.message ||
          "Failed to upload file. Please try again.";
        return errorMessage;
      },
    });
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
            : currentStep === "completed"
            ? "text-green-600"
            : "text-muted-foreground"
        }`}
      >
        <div
          className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
            currentStep === "select"
              ? "border-primary bg-primary text-white"
              : currentStep === "completed"
              ? "border-green-600 bg-green-600 text-white"
              : "border-muted-foreground"
          }`}
        >
          {currentStep === "completed" ? (
            <CheckCircle className="w-4 h-4" />
          ) : (
            "1"
          )}
        </div>
        <span className="text-sm font-medium">Upload Attendance File</span>
      </div>
    </div>
  );

  return (
    <>
      <Modal
        open={isOpen}
        setOpen={handleClose}
        title="Bulk Upload Attendance Records"
        description="Upload attendance records from Excel files"
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
                    accept=".xlsx,.xls"
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
                  onClick={handleUploadFile}
                  disabled={!selectedFile || processing}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  {processing ? "Uploading..." : "Upload File"}
                </Button>
              </div>
            </>
          )}

          {currentStep === "completed" && (
            <div className="text-center space-y-4">
              {processResult?.success ? (
                <>
                  <CheckCircle className="w-16 h-16 text-green-600 mx-auto" />
                  <h3 className="text-lg font-medium">
                    Upload Completed Successfully!
                  </h3>
                  <p className="text-muted-foreground">
                    {processResult?.totalRecords} attendance records have been
                    uploaded to the database.
                  </p>
                </>
              ) : (
                <>
                  <AlertTriangle className="w-16 h-16 text-orange-600 mx-auto" />
                  <h3 className="text-lg font-medium">
                    Upload Completed with Errors
                  </h3>
                  <p className="text-muted-foreground">
                    {processResult?.data?.successful_count || 0} records
                    processed successfully,
                    {processResult?.data?.error_count || 0} records had errors.
                  </p>
                  {processResult?.data?.errors &&
                    processResult.data.errors.length > 0 && (
                      <div className="mt-4 space-y-2">
                        <h4 className="font-medium text-left">
                          Error Details:
                        </h4>
                        <div className="max-h-40 overflow-y-auto space-y-2">
                          {processResult.data.errors
                            .slice(0, 10)
                            .map((error: any, index: number) => {
                              // Handle both string and object errors
                              const errorMessage =
                                typeof error === "string"
                                  ? error
                                  : error.error ||
                                    error.message ||
                                    JSON.stringify(error);

                              return (
                                <div
                                  key={index}
                                  className="p-3 bg-red-50 border border-red-200 rounded-md text-left"
                                >
                                  <div className="flex items-start space-x-2">
                                    <XCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                                    <p className="text-sm text-red-700">
                                      {errorMessage}
                                    </p>
                                  </div>
                                </div>
                              );
                            })}
                          {processResult.data.errors.length > 10 && (
                            <p className="text-sm text-muted-foreground text-left">
                              ... and {processResult.data.errors.length - 10}{" "}
                              more errors
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                </>
              )}
              <Button onClick={handleClose}>Close</Button>
            </div>
          )}
        </div>
      </Modal>
    </>
  );
}
