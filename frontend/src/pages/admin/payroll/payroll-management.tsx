import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DollarSign,
  Users,
  Calendar,
  TrendingUp,
  Settings,
  Plus,
  FileText,
  Download,
  Search,
  UserCog,
} from "lucide-react";
import { PayrollHeaderTable } from "@/components/tables/payroll-header-table";
import { PayrollTable } from "@/components/tables/payroll-table";
import { PayrollGenerationModal } from "@/components/modals/payroll-generation-modal";
import { PayrollConfigurationModal } from "@/components/modals/payroll-configuration-modal";
import { EmployeeOverrideManagement } from "@/components/modals/employee-override-management";
import { PayslipViewModal } from "@/components/modals/payslip-view-modal";
import { Input } from "@/components/ui/input";
import { usePayrollStore } from "@/store/payrollStore";
import { toast } from "sonner";
import type {
  PayrollHeader,
  Payslip,
  CreatePayrollHeader,
} from "@/models/payroll-model";
import { formatCurrency, formatDate } from "@/models/payroll-model";
import { useAttendanceStore } from "@/store/attendanceStore";

const PayrollManagement = () => {
  const {
    payrollHeaders,
    payslips,
    loading,
    error,
    fetchPayrollHeaders,
    fetchPayslips,
    fetchConfigs,
    generatePayroll,
  } = usePayrollStore();

  const {
    unconsumedTimesheets,
    fetchUnconsumedTimesheets,
    loading: attendanceLoading,
  } = useAttendanceStore();

  // Modal states
  const [generateModalOpen, setGenerateModalOpen] = useState(false);
  const [configModalOpen, setConfigModalOpen] = useState(false);
  const [overrideModalOpen, setOverrideModalOpen] = useState(false);
  const [payslipViewModalOpen, setPayslipViewModalOpen] = useState(false);
  const [selectedHeader, setSelectedHeader] = useState<PayrollHeader | null>(
    null
  );
  const [selectedPayslip, setSelectedPayslip] = useState<Payslip | null>(null);

  // Search and filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTab, setSelectedTab] = useState("overview");

  // Fetch initial data
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        await Promise.all([
          fetchPayrollHeaders(),
          fetchConfigs(),
          fetchUnconsumedTimesheets(),
        ]);
      } catch (error) {
        console.error("Error fetching initial data:", error);
      }
    };

    fetchInitialData();
  }, []); // Remove functions from dependencies since they're stable Zustand actions

  // Calculate totals from timesheets (moved before useEffect to avoid reference error)
  const totalTimesheetRecords = unconsumedTimesheets.reduce(
    (sum, timesheet) => sum + timesheet.recordCount,
    0
  );

  const totalTimesheetEmployees = unconsumedTimesheets.reduce(
    (sum, timesheet) => sum + timesheet.employeeCount,
    0
  );

  // Log unconsumed timesheets when they change
  useEffect(() => {
    if (unconsumedTimesheets.length > 0) {
      console.log("Unconsumed timesheets loaded:", {
        count: unconsumedTimesheets.length,
        totalRecords: totalTimesheetRecords,
        totalEmployees: totalTimesheetEmployees,
        timesheets: unconsumedTimesheets,
      });
    } else if (!attendanceLoading && unconsumedTimesheets.length === 0) {
      console.log("No unconsumed timesheets found");
    }
  }, [unconsumedTimesheets, attendanceLoading]);

  useEffect(() => {
    if (selectedHeader) {
      fetchPayslips(selectedHeader.payroll_header_id);
    }
  }, [selectedHeader, fetchPayslips]);

  // Calculate overview stats
  const currentMonthPayrolls = payrollHeaders.filter(
    (header: PayrollHeader) => {
      const headerDate = new Date(header.start_date);
      const currentDate = new Date();
      return (
        headerDate.getMonth() === currentDate.getMonth() &&
        headerDate.getFullYear() === currentDate.getFullYear()
      );
    }
  );

  const totalEmployeesThisMonth = currentMonthPayrolls.reduce(
    (sum: number, header: PayrollHeader) => {
      const employees = header.total_employees || 0;
      return sum + employees;
    },
    0
  );

  // Debug logging for dashboard calculations
  console.log("🔍 Dashboard Debug:", {
    totalPayrollHeaders: payrollHeaders.length,
    currentMonthPayrolls: currentMonthPayrolls.length,
    totalEmployeesThisMonth,
    sampleHeader: currentMonthPayrolls[0],
  });

  const totalGrossPayThisMonth = currentMonthPayrolls.reduce(
    (sum: number, header: PayrollHeader) => {
      const grossPay = header.total_gross_pay || 0;
      return sum + grossPay;
    },
    0
  );

  const totalNetPayThisMonth = currentMonthPayrolls.reduce(
    (sum: number, header: PayrollHeader) => {
      const netPay = header.total_net_pay || 0;
      return sum + netPay;
    },
    0
  );

  const handleGeneratePayrollClick = () => {
    setGenerateModalOpen(true);
  };

  const handleConfigClick = () => {
    setConfigModalOpen(true);
  };

  const handleGeneratePayroll = async (data: CreatePayrollHeader) => {
    try {
      await generatePayroll(data);
      toast.success("Payroll generated successfully!");
    } catch (error) {
      toast.error("Failed to generate payroll");
      console.error("Generate payroll error:", error);
    }
  };

  const handleViewPayroll = (header: PayrollHeader) => {
    setSelectedHeader(header);
    fetchPayslips(header.payroll_header_id);
    setSelectedTab("payslips");
  };

  const handleViewPayslip = (payslip: Payslip) => {
    setSelectedPayslip(payslip);
    setPayslipViewModalOpen(true);
  };

  if (loading && payrollHeaders.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading payroll data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>Try Again</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Payroll Management
          </h1>
          <p className="text-muted-foreground">
            Manage payroll processing, view payslips, and configure settings
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => setOverrideModalOpen(true)}
            variant="outline"
            className="items-center gap-2 hidden"
          >
            <UserCog className="h-4 w-4" />
            Employee Overrides
          </Button>
          <Button
            onClick={handleConfigClick}
            variant="outline"
            className="flex items-center gap-2 hover:text-primary cursor-pointer"
          >
            <Settings className="h-4 w-4" />
            Payroll Configuration
          </Button>
          <Button
            onClick={handleGeneratePayrollClick}
            className="flex items-center gap-2 cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            Generate Payroll
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Timesheets Ready
            </CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {unconsumedTimesheets.length}
            </div>
            <p className="text-xs text-muted-foreground">
              {totalTimesheetRecords} records, {totalTimesheetEmployees}{" "}
              employees
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Employees Paid
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalEmployeesThisMonth}</div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gross Pay</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(totalGrossPayThisMonth)}
            </div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Pay</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(totalNetPayThisMonth)}
            </div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs
        value={selectedTab}
        onValueChange={setSelectedTab}
        className="space-y-4"
      >
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="payroll-runs">Payroll Runs</TabsTrigger>
          <TabsTrigger value="payslips" disabled={!selectedHeader}>
            Payslips
            {selectedHeader && (
              <Badge variant="secondary" className="ml-2">
                {formatDate(selectedHeader.start_date)} -{" "}
                {formatDate(selectedHeader.end_date)}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Payroll Activity</CardTitle>
            </CardHeader>
            <CardContent>
              {payrollHeaders.length === 0 ? (
                <div className="text-center py-8">
                  <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No payroll runs yet</p>
                  <Button
                    onClick={handleGeneratePayrollClick}
                    className="mt-4"
                    variant="outline"
                  >
                    Generate Your First Payroll
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {payrollHeaders.slice(0, 5).map((header: PayrollHeader) => (
                    <div
                      key={header.payroll_header_id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 cursor-pointer"
                      onClick={() => handleViewPayroll(header)}
                    >
                      <div>
                        <p className="font-medium">
                          Payroll Run #{header.payroll_header_id}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {formatDate(header.start_date)} -{" "}
                          {formatDate(header.end_date)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">
                          {formatCurrency(header.total_net_pay || 0)}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {header.total_employees || 0} employees
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payroll-runs" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <CardTitle>Payroll Runs</CardTitle>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search payroll runs..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-8 w-64"
                    />
                  </div>
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <PayrollHeaderTable
                data={payrollHeaders}
                loading={loading}
                error={error}
                onViewPayroll={handleViewPayroll}
                searchTerm={searchTerm}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payslips" className="space-y-4">
          {selectedHeader && (
            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <CardTitle>
                      Payslips - Run #{selectedHeader.payroll_header_id}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Period: {formatDate(selectedHeader.start_date)} -{" "}
                      {formatDate(selectedHeader.end_date)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm">
                      <Download className="h-4 w-4 mr-2" />
                      Export All
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedHeader(null)}
                    >
                      Back to Runs
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <PayrollTable
                  data={payslips}
                  loading={loading}
                  error={error}
                  onViewPayslip={handleViewPayslip}
                />
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Modals */}
      <PayrollGenerationModal
        open={generateModalOpen}
        onOpenChange={setGenerateModalOpen}
        onGenerate={handleGeneratePayroll}
        loading={loading}
      />

      <PayrollConfigurationModal
        open={configModalOpen}
        onOpenChange={setConfigModalOpen}
        onUpdateConfig={async (
          configType: string,
          configKey: string,
          value: number,
          effectiveDate?: string
        ) => {
          try {
            const response = await fetch("/api/payroll-configuration/update", {
              method: "PUT",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${localStorage.getItem("token")}`,
              },
              body: JSON.stringify({
                config_type: configType,
                config_key: configKey,
                config_value: value,
                effective_date: effectiveDate,
              }),
            });

            if (!response.ok) {
              throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            if (!result.success) {
              throw new Error(
                result.message || "Failed to update configuration"
              );
            }

            console.log("Configuration updated successfully:", result.data);
          } catch (error) {
            console.error("Failed to update configuration:", error);
            throw error; // Re-throw to let the modal handle the error
          }
        }}
        loading={loading}
      />

      <EmployeeOverrideManagement
        open={overrideModalOpen}
        onOpenChange={setOverrideModalOpen}
      />

      <PayslipViewModal
        open={payslipViewModalOpen}
        onOpenChange={setPayslipViewModalOpen}
        payslip={selectedPayslip}
      />
    </div>
  );
};

export default PayrollManagement;
