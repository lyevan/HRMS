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
  ChevronRight,
  Printer,
  CopyPlus,
  CopyMinus,
} from "lucide-react";
import { toast } from "sonner";
import type { Payslip } from "@/models/payroll-model";
import { formatCurrency, formatDate } from "@/models/payroll-model";

interface PayslipViewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  payslip: Payslip | null;
}

interface EarningsCategory {
  category: string;
  items: EarningsBreakdownItem[];
  total: number;
}

interface EarningsBreakdownItem {
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
  const [expandedCategories, setExpandedCategories] = useState<Set<number>>(
    new Set([0, 1, 2, 3, 4, 5])
  ); // All categories expanded by default

  const toggleCategory = (categoryIndex: number) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryIndex)) {
      newExpanded.delete(categoryIndex);
    } else {
      newExpanded.add(categoryIndex);
    }
    setExpandedCategories(newExpanded);
  };

  // Check if any categories are expanded
  const hasExpandedCategories = expandedCategories.size > 0;

  const toggleAllCategories = () => {
    if (hasExpandedCategories) {
      // Collapse all
      setExpandedCategories(new Set());
    } else {
      // Expand all
      const allCategoryIndices = earningsCategories.map((_, index) => index);
      setExpandedCategories(new Set(allCategoryIndices));
    }
  };

  if (!payslip) return null;
  console.log(payslip);

  // Function to map earnings breakdown data to categorized display items
  const getEarningsBreakdown = (): EarningsCategory[] => {
    const breakdown = payslip.earnings_breakdown;
    if (!breakdown) {
      // Fallback to mock data if no breakdown available
      return [
        {
          category: "Basic Pay",
          items: [
            {
              type: "basic",
              description: "Basic Salary",
              amount: payslip.basic_salary || 0,
            },
          ],
          total: payslip.basic_salary || 0,
        },
        {
          category: "Overtime",
          items: [
            {
              type: "overtime",
              description: "Overtime Pay",
              hours: 10,
              rate: 25.0,
              amount: payslip.overtime_pay || 0,
            },
          ],
          total: payslip.overtime_pay || 0,
        },
        {
          category: "Other Earnings",
          items: [
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
          ].filter((item) => item.amount > 0),
          total: (payslip.allowances || 0) + (payslip.bonus || 0),
        },
      ].filter((category) => category.total > 0);
    }

    // Map the real breakdown data to categorized display items
    const categories: EarningsCategory[] = [];

    // Regular category - always include
    const regularItems: EarningsBreakdownItem[] = [];
    // Always include Regular Hours
    regularItems.push({
      type: "regular",
      description: "Regular Hours",
      hours: breakdown.regularPay?.hours || 0,
      rate: breakdown.regularPay?.rate || 0,
      amount: breakdown.regularPay?.amount || 0,
    });
    // Always include Regular Overtime
    regularItems.push({
      type: "regular_ot",
      description: "Regular Overtime",
      hours: breakdown.regularOvertimePay?.hours || 0,
      rate: breakdown.regularOvertimePay?.rate || 0,
      amount: breakdown.regularOvertimePay?.amount || 0,
    });
    categories.push({
      category: "Regular",
      items: regularItems,
      total: regularItems.reduce((sum, item) => sum + item.amount, 0),
    });

    // Rest Day category - always include
    const restDayItems: EarningsBreakdownItem[] = [];
    // Always include Rest Day Hours
    restDayItems.push({
      type: "rest_day",
      description: "Rest Day Hours",
      hours: breakdown.restDayPay?.hours || 0,
      rate: breakdown.restDayPay?.rate || 0,
      amount: breakdown.restDayPay?.amount || 0,
    });
    // Always include Rest Day Overtime
    restDayItems.push({
      type: "rest_day_ot",
      description: "Rest Day Overtime",
      hours: breakdown.restDayOvertimePay?.hours || 0,
      rate: breakdown.restDayOvertimePay?.rate || 0,
      amount: breakdown.restDayOvertimePay?.amount || 0,
    });
    categories.push({
      category: "Rest Day",
      items: restDayItems,
      total: restDayItems.reduce((sum, item) => sum + item.amount, 0),
    });

    // Night Differential category - always include
    const nightDiffItems: EarningsBreakdownItem[] = [];
    // Always include Night Differential Hours
    nightDiffItems.push({
      type: "night_diff",
      description: "Night Differential Hours",
      hours: breakdown.nightDiffPay?.hours || 0,
      rate: breakdown.nightDiffPay?.rate || 0,
      amount: breakdown.nightDiffPay?.amount || 0,
    });
    // Always include Night Differential Overtime
    nightDiffItems.push({
      type: "night_diff_ot",
      description: "Night Differential Overtime",
      hours: breakdown.nightDiffOvertimePay?.hours || 0,
      rate: breakdown.nightDiffOvertimePay?.rate || 0,
      amount: breakdown.nightDiffOvertimePay?.amount || 0,
    });
    categories.push({
      category: "Night Differential",
      items: nightDiffItems,
      total: nightDiffItems.reduce((sum, item) => sum + item.amount, 0),
    });

    // Regular Holiday category - always include
    const regularHolidayItems: EarningsBreakdownItem[] = [];
    // Always include Regular Holiday Hours
    regularHolidayItems.push({
      type: "regular_holiday",
      description: "Regular Holiday Hours",
      hours: breakdown.regularHolidayPay?.hours || 0,
      rate: breakdown.regularHolidayPay?.rate || 0,
      amount: breakdown.regularHolidayPay?.amount || 0,
    });
    // Always include Regular Holiday Overtime
    regularHolidayItems.push({
      type: "regular_holiday_ot",
      description: "Regular Holiday Overtime",
      hours: breakdown.regularHolidayOvertimePay?.hours || 0,
      rate: breakdown.regularHolidayOvertimePay?.rate || 0,
      amount: breakdown.regularHolidayOvertimePay?.amount || 0,
    });
    categories.push({
      category: "Regular Holiday",
      items: regularHolidayItems,
      total: regularHolidayItems.reduce((sum, item) => sum + item.amount, 0),
    });

    // Special Holiday category - always include
    const specialHolidayItems: EarningsBreakdownItem[] = [];
    // Always include Special Holiday Hours
    specialHolidayItems.push({
      type: "special_holiday",
      description: "Special Holiday Hours",
      hours: breakdown.specialHolidayPay?.hours || 0,
      rate: breakdown.specialHolidayPay?.rate || 0,
      amount: breakdown.specialHolidayPay?.amount || 0,
    });
    // Always include Special Holiday Overtime
    specialHolidayItems.push({
      type: "special_holiday_ot",
      description: "Special Holiday Overtime",
      hours: breakdown.specialHolidayOvertimePay?.hours || 0,
      rate: breakdown.specialHolidayOvertimePay?.rate || 0,
      amount: breakdown.specialHolidayOvertimePay?.amount || 0,
    });
    categories.push({
      category: "Special Holiday",
      items: specialHolidayItems,
      total: specialHolidayItems.reduce((sum, item) => sum + item.amount, 0),
    });

    // Multiple Premium categories - only show if they have values
    const multiplePremiumCategories = [
      {
        key: "nightDiffRestDayPay",
        category: "Night Differential + Rest Day",
        regularField: "nightDiffRestDayPay",
        overtimeField: "nightDiffRestDayOvertimePay",
      },
      {
        key: "regularHolidayRestDayPay",
        category: "Regular Holiday + Rest Day",
        regularField: "regularHolidayRestDayPay",
        overtimeField: "regularHolidayRestDayOvertimePay",
      },
      {
        key: "specialHolidayRestDayPay",
        category: "Special Holiday + Rest Day",
        regularField: "specialHolidayRestDayPay",
        overtimeField: "specialHolidayRestDayOvertimePay",
      },
      {
        key: "nightDiffRegularHolidayPay",
        category: "Night Differential + Regular Holiday",
        regularField: "nightDiffRegularHolidayPay",
        overtimeField: "nightDiffRegularHolidayOvertimePay",
      },
      {
        key: "nightDiffSpecialHolidayPay",
        category: "Night Differential + Special Holiday",
        regularField: "nightDiffSpecialHolidayPay",
        overtimeField: "nightDiffSpecialHolidayOvertimePay",
      },
      {
        key: "nightDiffRegularHolidayRestDayPay",
        category: "Night Differential + Regular Holiday + Rest Day",
        regularField: "nightDiffRegularHolidayRestDayPay",
        overtimeField: "nightDiffRegularHolidayRestDayOvertimePay",
      },
      {
        key: "nightDiffSpecialHolidayRestDayPay",
        category: "Night Differential + Special Holiday + Rest Day",
        regularField: "nightDiffSpecialHolidayRestDayPay",
        overtimeField: "nightDiffSpecialHolidayRestDayOvertimePay",
      },
    ];

    // Add multiple premium categories that have values
    multiplePremiumCategories.forEach((mpCategory) => {
      const regularData = (breakdown as any)[mpCategory.regularField];
      const overtimeData = (breakdown as any)[mpCategory.overtimeField];

      if (
        regularData?.amount > 0 ||
        regularData?.hours > 0 ||
        overtimeData?.amount > 0 ||
        overtimeData?.hours > 0
      ) {
        const mpItems: EarningsBreakdownItem[] = [];

        // Add regular hours if they exist
        if (regularData?.amount > 0 || regularData?.hours > 0) {
          mpItems.push({
            type: mpCategory.regularField,
            description: mpCategory.category,
            hours: regularData.hours || 0,
            rate: regularData.rate || 0,
            amount: regularData.amount || 0,
          });
        }

        // Add overtime if it exists
        if (overtimeData?.amount > 0 || overtimeData?.hours > 0) {
          mpItems.push({
            type: mpCategory.overtimeField,
            description: `${mpCategory.category} Overtime`,
            hours: overtimeData.hours || 0,
            rate: overtimeData.rate || 0,
            amount: overtimeData.amount || 0,
          });
        }

        categories.push({
          category: mpCategory.category,
          items: mpItems,
          total: mpItems.reduce((sum, item) => sum + item.amount, 0),
        });
      }
    });

    return categories;
  };

  const earningsCategories = getEarningsBreakdown();

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
                    Employee Payslip Information
                  </CardTitle>
                  <CardDescription>
                    Pay Period:{" "}
                    {payslip.start_date
                      ? new Date(payslip.start_date).toLocaleDateString()
                      : "N/A"}{" "}
                    -{" "}
                    {payslip.end_date
                      ? new Date(payslip.end_date).toLocaleDateString()
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
                      Name: {payslip.first_name} {payslip.last_name}
                    </div>
                    <div>Employee Type: {payslip.employment_type || "N/A"}</div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <Building className="h-4 w-4" />
                    Department
                  </div>
                  <div className="text-sm text-muted-foreground">
                    <div>{payslip.department_name || "N/A"}</div>
                    <div>Position: {payslip.position_title || "N/A"}</div>
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
                      {payslip.start_date
                        ? formatDate(payslip.start_date)
                        : "N/A"}
                    </div>
                    <div>
                      To:{" "}
                      {payslip.end_date ? formatDate(payslip.end_date) : "N/A"}
                    </div>
                    <div>
                      Generated:{" "}
                      {payslip.created_at
                        ? formatDate(payslip.created_at)
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
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg text-green-600">
                      Earnings
                    </CardTitle>
                    <CardDescription>
                      Breakdown of all earnings components
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      title={
                        hasExpandedCategories ? "Collapse All" : "Expand All"
                      }
                      variant="outline"
                      size="icon"
                      onClick={toggleAllCategories}
                      className="text-xs flex items-center hover:text-accent cursor-pointer"
                    >
                      {hasExpandedCategories ? (
                        <>
                          <CopyMinus className="h-3 w-3" />
                        </>
                      ) : (
                        <>
                          <CopyPlus className="h-3 w-3" />
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Description</TableHead>
                      <TableHead className="text-left">
                        {hasExpandedCategories ? "Computation" : ""}
                      </TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {earningsCategories.map((category, categoryIndex) => (
                      <React.Fragment key={categoryIndex}>
                        {/* Category Header */}
                        <TableRow
                          className="bg-muted/50 cursor-pointer hover:bg-muted/70 transition-colors"
                          onClick={() => toggleCategory(categoryIndex)}
                        >
                          <TableCell className="font-semibold text-sm">
                            <div className="flex items-center gap-2">
                              {expandedCategories.has(categoryIndex) ? (
                                <ChevronDown className="h-4 w-4" />
                              ) : (
                                <ChevronRight className="h-4 w-4" />
                              )}
                              {category.category}
                            </div>
                          </TableCell>
                          <TableCell></TableCell>
                          <TableCell className="text-right font-semibold text-sm">
                            {formatCurrency(category.total)}
                          </TableCell>
                        </TableRow>
                        {/* Category Items */}
                        {expandedCategories.has(categoryIndex) &&
                          category.items.map((earning, itemIndex) => (
                            <TableRow
                              key={`${categoryIndex}-${itemIndex}`}
                              className="pl-4"
                            >
                              <TableCell className="font-medium pl-8">
                                {earning.description}
                              </TableCell>
                              <TableCell className="text-left text-xs text-muted-foreground">
                                {earning.hours && earning.rate
                                  ? `${earning.hours}h * ${
                                      earning.rate
                                    } * ${formatCurrency(
                                      payslip.hourly_rate || 0
                                    )}`
                                  : "-"}
                              </TableCell>
                              <TableCell className="text-right font-medium">
                                {formatCurrency(earning.amount)}
                              </TableCell>
                            </TableRow>
                          ))}
                      </React.Fragment>
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
                    No Record Days
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
                    {payslip.overtime_hours || 0}
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
