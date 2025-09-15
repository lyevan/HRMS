import type { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Eye, Download } from "lucide-react";
import type { PayrollHeader } from "@/models/payroll-model";
import { formatCurrency, formatDate } from "@/models/payroll-model";

export const createPayrollHeaderColumns = (
  onViewPayroll: (header: PayrollHeader) => void
): ColumnDef<PayrollHeader>[] => [
  {
    accessorKey: "payroll_header_id",
    header: "Run ID",
    cell: ({ row }) => (
      <div className="font-medium">#{row.getValue("payroll_header_id")}</div>
    ),
  },
  {
    accessorKey: "start_date",
    header: "Period",
    cell: ({ row }) => (
      <div className="space-y-1">
        <div className="font-medium">
          {formatDate(row.getValue("start_date"))}
        </div>
        <div className="text-sm text-muted-foreground">
          to {formatDate(row.original.end_date)}
        </div>
      </div>
    ),
  },
  {
    accessorKey: "run_date",
    header: "Run Date",
    cell: ({ row }) => <div>{formatDate(row.getValue("run_date"))}</div>,
  },
  {
    accessorKey: "total_employees",
    header: "Employees",
    cell: ({ row }) => (
      <Badge variant="secondary">
        {row.getValue("total_employees") || 0} employees
      </Badge>
    ),
  },
  {
    accessorKey: "total_gross_pay",
    header: "Gross Pay",
    cell: ({ row }) => (
      <div className="font-medium">
        {formatCurrency(row.getValue("total_gross_pay") || 0)}
      </div>
    ),
  },
  {
    accessorKey: "total_net_pay",
    header: "Net Pay",
    cell: ({ row }) => (
      <div className="font-medium text-green-600">
        {formatCurrency(row.getValue("total_net_pay") || 0)}
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
          onClick={() => onViewPayroll(row.original)}
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
