import type { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Eye, Download } from "lucide-react";
import type { Payslip } from "@/models/payroll-model";
import { formatCurrency, getRateTypeLabel } from "@/models/payroll-model";

export const createPayrollColumns = (
  onViewPayslip?: (payslip: Payslip) => void
): ColumnDef<Payslip>[] => [
  {
    accessorKey: "employee_id",
    header: "Employee ID",
    cell: ({ row }) => (
      <div className="font-medium">{row.getValue("employee_id")}</div>
    ),
  },
  {
    accessorKey: "first_name",
    header: "Employee Name",
    cell: ({ row }) => (
      <div className="space-y-1">
        <div className="font-medium">
          {row.original.first_name} {row.original.last_name}
        </div>
        <div className="text-sm text-muted-foreground">
          {row.original.position_title}
        </div>
      </div>
    ),
  },
  {
    accessorKey: "department_name",
    header: "Department",
    cell: ({ row }) => (
      <Badge variant="outline">
        {row.getValue("department_name") || "N/A"}
      </Badge>
    ),
  },
  {
    accessorKey: "rate_type",
    header: "Rate Type",
    cell: ({ row }) => (
      <Badge variant="secondary">
        {getRateTypeLabel(row.getValue("rate_type") || "")}
      </Badge>
    ),
  },
  {
    accessorKey: "gross_pay",
    header: "Gross Pay",
    cell: ({ row }) => (
      <div className="font-medium">
        {formatCurrency(row.getValue("gross_pay"))}
      </div>
    ),
  },
  {
    accessorKey: "overtime_pay",
    header: "Overtime",
    cell: ({ row }) => (
      <div className="text-blue-600">
        {formatCurrency(row.getValue("overtime_pay") || 0)}
      </div>
    ),
  },
  {
    accessorKey: "deductions",
    header: "Deductions",
    cell: ({ row }) => (
      <div className="text-red-600">
        -{formatCurrency(row.getValue("deductions") || 0)}
      </div>
    ),
  },
  {
    accessorKey: "net_pay",
    header: "Net Pay",
    cell: ({ row }) => (
      <div className="font-medium text-green-600">
        {formatCurrency(row.getValue("net_pay"))}
      </div>
    ),
  },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onViewPayslip?.(row.original)}
          className="flex items-center gap-1"
        >
          <Eye className="h-3 w-3" />
          View
        </Button>
        <Button variant="outline" size="sm" className="flex items-center gap-1">
          <Download className="h-3 w-3" />
          Export
        </Button>
      </div>
    ),
  },
];
