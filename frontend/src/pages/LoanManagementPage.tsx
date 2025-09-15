import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { LoanManagementModal } from "@/components/modals/loan-management-modal";
import { Search, Plus, CreditCard, Filter, Download, Eye } from "lucide-react";

interface Employee {
  employee_id: string;
  first_name: string;
  last_name: string;
  department?: string;
}

interface LoanSummary {
  employee_id: string;
  employee_name: string;
  department?: string;
  total_loans: number;
  total_outstanding: number;
  monthly_deduction: number;
  active_loans: number;
  last_payment_date?: string;
}

export default function LoanManagementPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loanSummaries, setLoanSummaries] = useState<LoanSummary[]>([]);
  const [filteredSummaries, setFilteredSummaries] = useState<LoanSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(
    null
  );
  const [showLoanModal, setShowLoanModal] = useState(false);

  // Filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [loanSummaries, searchTerm, departmentFilter, statusFilter]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch all employees
      const employeesResponse = await fetch("/api/employees");
      if (employeesResponse.ok) {
        const employeesData = await employeesResponse.json();
        setEmployees(employeesData.data || []);
      } else {
        console.warn(
          "Employees endpoint not available:",
          employeesResponse.status
        );
      }

      // Fetch loan summaries - endpoint may not exist yet
      try {
        const summariesResponse = await fetch("/api/loans/summaries");
        if (summariesResponse.ok) {
          const summariesData = await summariesResponse.json();
          setLoanSummaries(summariesData.data || []);
        } else {
          console.warn(
            "Loan summaries endpoint not available:",
            summariesResponse.status
          );
          // Use empty data for now
          setLoanSummaries([]);
        }
      } catch (summariesError) {
        console.warn("Loan summaries API not implemented yet");
        setLoanSummaries([]);
      }
    } catch (error) {
      console.error("Failed to fetch data:", error);
      // Set empty data to prevent crashes
      setEmployees([]);
      setLoanSummaries([]);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...loanSummaries];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (summary) =>
          summary.employee_name
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          summary.employee_id.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Department filter
    if (departmentFilter && departmentFilter !== "all") {
      filtered = filtered.filter(
        (summary) => summary.department === departmentFilter
      );
    }

    // Status filter
    if (statusFilter === "active") {
      filtered = filtered.filter((summary) => summary.active_loans > 0);
    } else if (statusFilter === "no_loans") {
      filtered = filtered.filter((summary) => summary.total_loans === 0);
    }

    setFilteredSummaries(filtered);
  };

  const handleOpenLoanModal = (employee: Employee) => {
    setSelectedEmployee(employee);
    setShowLoanModal(true);
  };

  const handleCloseLoanModal = () => {
    setShowLoanModal(false);
    setSelectedEmployee(null);
    // Refresh data after modal closes
    fetchData();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
    }).format(amount);
  };

  const getTotalOutstanding = () => {
    return filteredSummaries.reduce(
      (sum, summary) => sum + summary.total_outstanding,
      0
    );
  };

  const getTotalMonthlyDeductions = () => {
    return filteredSummaries.reduce(
      (sum, summary) => sum + summary.monthly_deduction,
      0
    );
  };

  const getUniqueDepartments = () => {
    const departments = loanSummaries
      .map((summary) => summary.department)
      .filter((dept) => dept)
      .filter((dept, index, arr) => arr.indexOf(dept) === index);
    return departments as string[];
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Loan Management</h1>
          <p className="text-muted-foreground">
            Manage employee loans, cash advances, and installment payments
          </p>
        </div>
        <Button
          onClick={() => {
            // Open modal without specific employee (for creating new loans)
            setSelectedEmployee(null);
            setShowLoanModal(true);
          }}
        >
          <Plus className="h-4 w-4 mr-2" />
          New Loan
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Outstanding
            </CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {formatCurrency(getTotalOutstanding())}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Monthly Deductions
            </CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {formatCurrency(getTotalMonthlyDeductions())}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Employees with Loans
            </CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {filteredSummaries.filter((s) => s.active_loans > 0).length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Active Loans
            </CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {filteredSummaries.reduce((sum, s) => sum + s.active_loans, 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Search</label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search employees..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Department</label>
              <Select
                value={departmentFilter}
                onValueChange={setDepartmentFilter}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All departments" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All departments</SelectItem>
                  {getUniqueDepartments().map((dept) => (
                    <SelectItem key={dept} value={dept}>
                      {dept}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="active">Has active loans</SelectItem>
                  <SelectItem value="no_loans">No loans</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Actions</label>
              <Button variant="outline" className="w-full">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Loan Summaries Table */}
      <Card>
        <CardHeader>
          <CardTitle>Employee Loan Summary</CardTitle>
          <CardDescription>
            Overview of all employee loans and cash advances
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead className="text-center">Active Loans</TableHead>
                  <TableHead className="text-right">Outstanding</TableHead>
                  <TableHead className="text-right">
                    Monthly Deduction
                  </TableHead>
                  <TableHead>Last Payment</TableHead>
                  <TableHead className="text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSummaries.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <CreditCard className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">
                        No loan data found
                      </p>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredSummaries.map((summary) => (
                    <TableRow key={summary.employee_id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{summary.employee_name}</p>
                          <p className="text-sm text-muted-foreground">
                            {summary.employee_id}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>{summary.department || "-"}</TableCell>
                      <TableCell className="text-center">
                        <Badge
                          variant={
                            summary.active_loans > 0 ? "default" : "secondary"
                          }
                        >
                          {summary.active_loans}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {summary.total_outstanding > 0 ? (
                          <span className="text-orange-600">
                            {formatCurrency(summary.total_outstanding)}
                          </span>
                        ) : (
                          "-"
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {summary.monthly_deduction > 0
                          ? formatCurrency(summary.monthly_deduction)
                          : "-"}
                      </TableCell>
                      <TableCell>
                        {summary.last_payment_date
                          ? new Date(
                              summary.last_payment_date
                            ).toLocaleDateString()
                          : "-"}
                      </TableCell>
                      <TableCell className="text-center">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const employee = employees.find(
                              (e) => e.employee_id === summary.employee_id
                            );
                            if (employee) {
                              handleOpenLoanModal(employee);
                            }
                          }}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Loan Management Modal */}
      <LoanManagementModal
        open={showLoanModal}
        onOpenChange={handleCloseLoanModal}
        selectedEmployeeId={selectedEmployee?.employee_id}
        selectedEmployeeName={
          selectedEmployee
            ? `${selectedEmployee.first_name} ${selectedEmployee.last_name}`
            : undefined
        }
      />
    </div>
  );
}
