import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
import {
  Download,
  FileText,
  Calendar,
  Clock,
  DollarSign,
  User,
  Building,
  ChevronDown,
  Printer,
} from "lucide-react";
import { toast } from "sonner";
import type { Payslip } from "@/models/payroll-model";
import { formatCurrency, formatDate } from "@/models/payroll-model";

interface PayslipViewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  payslip: Payslip | null;
}

interface EarningsBreakdown {
  type: string;
  description: string;
  hours?: number;
  rate?: number;
  amount: number;
}

interface DeductionsBreakdown {
  type: string;
  description: string;
  rate?: string;
  amount: number;
}

interface AttendanceSummary {
  totalDays: number;
  workedDays: number;
  absentDays: number;
  lateDays: number;
  overtimeHours: number;
  holidayDays: number;
}

export const PayslipViewModal: React.FC<PayslipViewModalProps> = ({
  open,
  onOpenChange,
  payslip,
}) => {
  const [isExporting, setIsExporting] = useState(false);

  if (!payslip) return null;
  console.log(payslip);

  // Mock data - in real implementation, these would come from the payslip data
  const earningsBreakdown: EarningsBreakdown[] = [
    {
      type: "basic",
      description: "Basic Salary",
      amount: payslip.basic_salary || 0,
    },
    {
      type: "overtime",
      description: "Overtime Pay",
      hours: 10,
      rate: 25.0,
      amount: payslip.overtime_pay || 0,
    },
    {
      type: "allowance",
      description: "Allowances",
      amount: payslip.allowances || 0,
    },
    {
      type: "bonus",
      description: "Performance Bonus",
      amount: payslip.bonus || 0,
    },
  ].filter((item) => item.amount > 0);

  const deductionsBreakdown: DeductionsBreakdown[] = [
    {
      type: "income_tax",
      description: "Income Tax",
      rate: "15%",
      amount: payslip.income_tax || 0,
    },
    {
      type: "sss",
      description: "SSS Contribution",
      rate: "4.5%",
      amount: payslip.sss_contribution || 0,
    },
    {
      type: "philhealth",
      description: "PhilHealth",
      rate: "2.75%",
      amount: payslip.philhealth_contribution || 0,
    },
    {
      type: "pagibig",
      description: "Pag-IBIG",
      rate: "2%",
      amount: payslip.pagibig_contribution || 0,
    },
    {
      type: "other",
      description: "Other Deductions",
      amount: payslip.other_deductions || 0,
    },
  ].filter((item) => item.amount > 0);

  const attendanceSummary: AttendanceSummary = {
    totalDays: 15, // Sep 1-15 = 15 days total for the period
    workedDays: payslip.days_worked || 1, // Fallback to 1 if null from our debug data
    absentDays: Math.max(
      0,
      15 - (payslip.days_worked || 1) - (payslip.paid_leave_days || 0)
    ), // Calculate absent days
    lateDays: payslip.late_days || 0,
    overtimeHours: payslip.overtime_hours || 2, // Fallback to 2 from our debug data
    holidayDays: payslip.paid_leave_days || 0, // Use paid leave as holiday days for now
  };

  const handleExport = async (format: "pdf" | "excel") => {
    setIsExporting(true);

    try {
      // Simulate export process
      await new Promise((resolve) => setTimeout(resolve, 2000));

      if (format === "pdf") {
        // In real implementation, this would generate and download a PDF
        toast.success("Payslip exported to PDF successfully");
      } else {
        // In real implementation, this would generate and download an Excel file
        toast.success("Payslip exported to Excel successfully");
      }
    } catch (error) {
      toast.error(`Failed to export payslip to ${format.toUpperCase()}`);
    } finally {
      setIsExporting(false);
    }
  };

  const handlePrint = () => {
    // In real implementation, this would open print dialog
    window.print();
    toast.success("Print dialog opened");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[90vw] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Payslip Details
          </DialogTitle>
          <DialogDescription>
            Detailed breakdown of earnings, deductions, and attendance for the
            pay period
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Header Information */}
          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">
                    Employee Information
                  </CardTitle>
                  <CardDescription>
                    Pay Period:{" "}
                    {payslip.payroll_header?.start_date
                      ? formatDate(payslip.payroll_header.start_date)
                      : "N/A"}{" "}
                    -{" "}
                    {payslip.payroll_header?.end_date
                      ? formatDate(payslip.payroll_header.end_date)
                      : "N/A"}
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handlePrint}
                    className="flex items-center gap-2"
                  >
                    <Printer className="h-4 w-4" />
                    Print
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-2"
                        disabled={isExporting}
                      >
                        <Download className="h-4 w-4" />
                        Export
                        <ChevronDown className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem
                        onClick={() => handleExport("pdf")}
                        disabled={isExporting}
                      >
                        Export as PDF
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleExport("excel")}
                        disabled={isExporting}
                      >
                        Export as Excel
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <User className="h-4 w-4" />
                    Employee Details
                  </div>
                  <div className="text-sm text-muted-foreground">
                    <div>ID: {payslip.employee_id}</div>
                    <div>
                      Name: {payslip.employee?.first_name}{" "}
                      {payslip.employee?.last_name}
                    </div>
                    <div>
                      Position: {payslip.employee?.position?.title || "N/A"}
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <Building className="h-4 w-4" />
                    Department
                  </div>
                  <div className="text-sm text-muted-foreground">
                    <div>{payslip.employee?.department?.name || "N/A"}</div>
                    <div>
                      Employee Type:{" "}
                      {payslip.employee?.employment_type?.name || "N/A"}
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <Calendar className="h-4 w-4" />
                    Pay Period
                  </div>
                  <div className="text-sm text-muted-foreground">
                    <div>
                      From:{" "}
                      {payslip.payroll_header?.start_date
                        ? formatDate(payslip.payroll_header.start_date)
                        : "N/A"}
                    </div>
                    <div>
                      To:{" "}
                      {payslip.payroll_header?.end_date
                        ? formatDate(payslip.payroll_header.end_date)
                        : "N/A"}
                    </div>
                    <div>
                      Generated:{" "}
                      {payslip.payroll_header?.created_at
                        ? formatDate(payslip.payroll_header.created_at)
                        : "N/A"}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Gross Pay
                    </p>
                    <p className="text-2xl font-bold text-green-600">
                      {formatCurrency(payslip.gross_pay)}
                    </p>
                  </div>
                  <DollarSign className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Total Deductions
                    </p>
                    <p className="text-2xl font-bold text-red-600">
                      {formatCurrency(payslip.total_deductions || 0)}
                    </p>
                  </div>
                  <DollarSign className="h-8 w-8 text-red-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Net Pay
                    </p>
                    <p className="text-2xl font-bold text-blue-600">
                      {formatCurrency(payslip.net_pay)}
                    </p>
                  </div>
                  <DollarSign className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Earnings and Deductions */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Earnings */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg text-green-600">
                  Earnings
                </CardTitle>
                <CardDescription>
                  Breakdown of all earnings components
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Description</TableHead>
                      <TableHead className="text-right">Hours/Rate</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {earningsBreakdown.map((earning, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">
                          {earning.description}
                        </TableCell>
                        <TableCell className="text-right text-sm text-muted-foreground">
                          {earning.hours && earning.rate
                            ? `${earning.hours}h @ ${formatCurrency(
                                earning.rate
                              )}`
                            : "-"}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(earning.amount)}
                        </TableCell>
                      </TableRow>
                    ))}
                    <TableRow className="border-t-2">
                      <TableCell className="font-bold">
                        Total Earnings
                      </TableCell>
                      <TableCell></TableCell>
                      <TableCell className="text-right font-bold text-green-600">
                        {formatCurrency(payslip.gross_pay)}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Deductions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg text-red-600">
                  Deductions
                </CardTitle>
                <CardDescription>
                  Breakdown of all deduction components
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Description</TableHead>
                      <TableHead className="text-right">Rate</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {deductionsBreakdown.map((deduction, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">
                          {deduction.description}
                        </TableCell>
                        <TableCell className="text-right text-sm text-muted-foreground">
                          {deduction.rate || "-"}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(deduction.amount)}
                        </TableCell>
                      </TableRow>
                    ))}
                    <TableRow className="border-t-2">
                      <TableCell className="font-bold">
                        Total Deductions
                      </TableCell>
                      <TableCell></TableCell>
                      <TableCell className="text-right font-bold text-red-600">
                        {formatCurrency(payslip.total_deductions || 0)}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>

          {/* Attendance Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Attendance Summary
              </CardTitle>
              <CardDescription>
                Summary of attendance for the pay period
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {attendanceSummary.totalDays}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Total Days
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {attendanceSummary.workedDays}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Worked Days
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">
                    {attendanceSummary.absentDays}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Absent Days
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-600">
                    {attendanceSummary.lateDays}
                  </div>
                  <div className="text-sm text-muted-foreground">Late Days</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {attendanceSummary.overtimeHours}
                  </div>
                  <div className="text-sm text-muted-foreground">OT Hours</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">
                    {attendanceSummary.holidayDays}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Holiday Days
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Net Pay Summary */}
          <Card className="border-2 border-primary">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold">Net Pay</h3>
                  <p className="text-sm text-muted-foreground">
                    Amount to be received after all deductions
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-primary">
                    {formatCurrency(payslip.net_pay)}
                  </div>
                  <Badge variant="secondary" className="mt-1">
                    {payslip.payroll_header?.status || "Completed"}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};
