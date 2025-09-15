import {
  type ColumnDef,
  flexRender,
  type ColumnFiltersState,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  useReactTable,
} from "@tanstack/react-table";

import {
  Funnel,
  Download,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  CalendarDays,
  Filter,
  RefreshCcw,
  CalendarCog,
} from "lucide-react";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useState } from "react";
import { Input } from "../ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from "../ui/dropdown-menu";
import { Button } from "../ui/button";
import { toast } from "sonner";
import { useIsMobile } from "@/hooks/use-mobile";
import { Badge } from "../ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Calendar } from "../ui/calendar";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import type { AttendanceRecord } from "@/models/attendance-model";
import { getAttendanceStatusText } from "@/models/attendance-model";
import { useAttendanceStore } from "@/store/attendanceStore";
import axios from "axios";
import { useUserSessionStore } from "@/store/userSessionStore";

interface ProcessTimesheetTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  loading?: boolean;
  error?: string | null;
  selectedRecords?: AttendanceRecord[];
  onSelectionChange?: (records: AttendanceRecord[]) => void;
}

export function ProcessTimesheetTable<TData extends AttendanceRecord, TValue>({
  columns,
  data,
  loading = false,
  error = null,
  selectedRecords = [],
  onSelectionChange,
}: ProcessTimesheetTableProps<TData, TValue>) {
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [filterInput, setFilterInput] = useState("employee_name");
  const [pageSize, setPageSize] = useState(10);
  const [pageIndex, setPageIndex] = useState(0);
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [dateRange, setDateRange] = useState<{
    from: Date | undefined;
    to: Date | undefined;
  }>({
    from: undefined,
    to: undefined,
  });
  const isMobile = useIsMobile();
  const { fetchAttendanceRecords } = useAttendanceStore();
  const { employee } = useUserSessionStore();

  // Handle row selection for attendance records
  const handleRecordSelection = (
    record: AttendanceRecord,
    isSelected: boolean
  ) => {
    if (!onSelectionChange) return;

    if (isSelected) {
      onSelectionChange([...selectedRecords, record]);
    } else {
      onSelectionChange(
        selectedRecords.filter(
          (rec) => rec.attendance_id !== record.attendance_id
        )
      );
    }
  };

  const handleSelectAll = (isSelected: boolean) => {
    if (!onSelectionChange) return;

    if (isSelected) {
      onSelectionChange(filteredData as AttendanceRecord[]);
    } else {
      onSelectionChange([]);
    }
  };

  const handleProcessTimesheet = async () => {
    try {
      if (selectedRecords.length === 0) {
        toast.error("No records selected for processing.");
        return;
      }

      if (!dateRange.from || !dateRange.to) {
        toast.error("Please select a valid date range.");
        return;
      }

      const response = await axios.patch("/attendance/process-timesheet", {
        attendanceIds: selectedRecords.map((rec) => rec.attendance_id),
        startDate: dateRange.from,
        endDate: dateRange.to,
        approverId: employee?.employee_id,
      });
      if (response.data.success) {
        toast.success(
          `Timesheet for ${selectedRecords.length} records processed successfully.`
        );
      }
    } catch (error) {
      toast.error(
        (error as any).response.data.message || "Failed to process timesheet."
      );
    }
  };

  const isRecordSelected = (record: AttendanceRecord) => {
    return selectedRecords.some(
      (rec) => rec.attendance_id === record.attendance_id
    );
  };

  // Filter data based on date range and status
  const filteredData = data.filter((record) => {
    // Date range filter
    if (dateRange.from || dateRange.to) {
      const recordDate = new Date(record.date);
      if (dateRange.from && recordDate < dateRange.from) return false;
      if (dateRange.to && recordDate > dateRange.to) return false;
    }

    // Status filter
    if (statusFilter.length > 0) {
      const status = getAttendanceStatusText(record).toLowerCase();
      if (
        !statusFilter.some((filter) => status.includes(filter.toLowerCase()))
      ) {
        return false;
      }
    }

    return true;
  });

  // Create columns with checkbox (only if onSelectionChange is provided)
  const columnsWithCheckbox = onSelectionChange
    ? [
        {
          id: "select",
          header: () => (
            <input
              type="checkbox"
              checked={
                selectedRecords.length === filteredData.length &&
                filteredData.length > 0
              }
              onChange={(e) => handleSelectAll(e.target.checked)}
              className="rounded"
              disabled={loading}
            />
          ),
          cell: ({ row }: any) => (
            <input
              type="checkbox"
              checked={isRecordSelected(row.original)}
              onChange={(e) =>
                handleRecordSelection(row.original, e.target.checked)
              }
              className="rounded"
              disabled={loading}
            />
          ),
          enableSorting: false,
          enableColumnFilter: false,
        },
        ...columns,
      ]
    : columns;

  const table = useReactTable({
    data: filteredData,
    columns: columnsWithCheckbox,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onColumnFiltersChange: setColumnFilters,
    initialState: {
      pagination: {
        pageSize: 10,
        pageIndex: 0,
      },
    },
    state: {
      columnFilters,
      pagination: {
        pageIndex,
        pageSize,
      },
    },
    onPaginationChange: (updater) => {
      if (typeof updater === "function") {
        const currentState = { pageIndex, pageSize };
        const newState = updater(currentState);
        setPageIndex(newState.pageIndex);
        setPageSize(newState.pageSize);
      }
    },
  });

  const handleStatusFilterChange = (status: string, checked: boolean) => {
    setStatusFilter((prev) =>
      checked ? [...prev, status] : prev.filter((s) => s !== status)
    );
  };

  const clearDateRange = () => {
    setDateRange({ from: undefined, to: undefined });
  };

  const clearStatusFilter = () => {
    setStatusFilter([]);
  };

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
    <div>
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between w-full gap-4 py-4 font-[Nunito]">
        {/* Search and Filter Controls */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
          <div className="flex items-center gap-2">
            <Input
              placeholder={
                !isMobile
                  ? `Search by ${filterInput.split("_").join(" ")}...`
                  : "Search..."
              }
              value={
                (table.getColumn(filterInput)?.getFilterValue() as string) ?? ""
              }
              onChange={(event) =>
                table.getColumn(filterInput)?.setFilterValue(event.target.value)
              }
              className="max-w-xs"
              disabled={loading}
            />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size={"icon"} disabled={loading}>
                  <Funnel />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56 font-[Nunito]">
                <DropdownMenuLabel>Search by:</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuRadioGroup
                  value={filterInput}
                  onValueChange={setFilterInput}
                >
                  <DropdownMenuRadioItem value="employee_id">
                    Employee ID
                  </DropdownMenuRadioItem>
                  <DropdownMenuRadioItem defaultChecked value="employee_name">
                    Employee Name
                  </DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="date">
                    Date
                  </DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="status">
                    Status
                  </DropdownMenuRadioItem>
                </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Status Filter */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2" disabled={loading}>
                <Filter className="h-4 w-4" />
                Status
                {statusFilter.length > 0 && (
                  <Badge variant="secondary" className="ml-1">
                    {statusFilter.length}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56 font-[Nunito]">
              <DropdownMenuLabel>Filter by Status:</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuCheckboxItem
                checked={statusFilter.includes("Present")}
                onCheckedChange={(checked) =>
                  handleStatusFilterChange("Present", checked)
                }
              >
                Present
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={statusFilter.includes("Late")}
                onCheckedChange={(checked) =>
                  handleStatusFilterChange("Late", checked)
                }
              >
                Late
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={statusFilter.includes("Absent")}
                onCheckedChange={(checked) =>
                  handleStatusFilterChange("Absent", checked)
                }
              >
                Absent
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={statusFilter.includes("Leave")}
                onCheckedChange={(checked) =>
                  handleStatusFilterChange("Leave", checked)
                }
              >
                On Leave
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={statusFilter.includes("Half")}
                onCheckedChange={(checked) =>
                  handleStatusFilterChange("Half", checked)
                }
              >
                Half Day
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={statusFilter.includes("Undertime")}
                onCheckedChange={(checked) =>
                  handleStatusFilterChange("Undertime", checked)
                }
              >
                Undertime
              </DropdownMenuCheckboxItem>
              {statusFilter.length > 0 && (
                <>
                  <DropdownMenuSeparator />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearStatusFilter}
                    className="w-full"
                  >
                    Clear Filters
                  </Button>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
          <Button onClick={() => fetchAttendanceRecords(true)}>
            <RefreshCcw />
            Refresh View
          </Button>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* Date Range Picker */}

          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "gap-2 justify-start text-left font-normal cursor-pointer",
                  !dateRange.from &&
                    !dateRange.to &&
                    "text-muted-foreground hover:text-primary"
                )}
                disabled={loading}
              >
                <CalendarDays className="h-4 w-4" />
                {dateRange.from ? (
                  dateRange.to ? (
                    <>
                      {format(dateRange.from, "LLL dd, y")} -{" "}
                      {format(dateRange.to, "LLL dd, y")}
                    </>
                  ) : (
                    format(dateRange.from, "LLL dd, y")
                  )
                ) : (
                  <span>{isMobile ? "Date" : "Pick date range"}</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={dateRange.from}
                selected={{ from: dateRange.from, to: dateRange.to }}
                onSelect={(range: any) =>
                  setDateRange({
                    from: range?.from,
                    to: range?.to,
                  })
                }
                numberOfMonths={2}
              />
              {(dateRange.from || dateRange.to) && (
                <div className="p-3 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={clearDateRange}
                    className="w-full"
                  >
                    Clear Date Range
                  </Button>
                </div>
              )}
            </PopoverContent>
          </Popover>

          <Button
            variant="default"
            size={isMobile ? "icon" : "default"}
            className="bg-accent hover:bg-accent/90 cursor-pointer"
            onClick={() => handleProcessTimesheet()}
            disabled={loading}
          >
            <CalendarCog />
            Process Timesheet
          </Button>
        </div>
      </div>

      {/* Selection Summary */}
      {onSelectionChange && selectedRecords.length > 0 && (
        <div className="flex items-center justify-between px-4 py-2 bg-blue-50 border border-blue-200 rounded-md mb-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-blue-700">
              {selectedRecords.length} record
              {selectedRecords.length === 1 ? "" : "s"} selected
            </span>
            {selectedRecords.length === filteredData.length &&
              filteredData.length > 0 && (
                <Badge variant="secondary" className="text-xs">
                  All visible
                </Badge>
              )}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onSelectionChange([])}
            className="text-xs"
          >
            Clear Selection
          </Button>
        </div>
      )}

      {/* Table */}
      <div className="overflow-hidden rounded-md border border-muted-foreground/30 font-[Nunito]">
        <Table>
          <TableHeader className="bg-primary text-primary-foreground border border-muted-foreground/30">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="hover:bg-primary">
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead
                      key={header.id}
                      className="text-primary-foreground font-bold"
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  Loading attendance records...
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  className="border-b border-muted-foreground/30"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No attendance records found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      {/* Pagination Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between px-2 py-4 gap-4">
        <div className="flex items-center space-x-2">
          <p className="text-sm font-medium">Rows per page</p>
          <select
            value={pageSize}
            onChange={(e) => {
              const newSize = Number(e.target.value);
              setPageSize(newSize);
              setPageIndex(0);
              table.setPageSize(newSize);
            }}
            className="h-8 w-[70px] rounded border border-input bg-background px-3 py-1 text-sm"
            disabled={loading}
          >
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
        </div>

        <div className="flex items-center space-x-6 lg:space-x-8">
          <div className="flex w-[100px] items-center justify-center text-sm font-medium">
            Page {table.getState().pagination.pageIndex + 1} of{" "}
            {table.getPageCount() || 1}
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              className="hidden h-8 w-8 p-0 lg:flex"
              onClick={() => table.setPageIndex(0)}
              disabled={!table.getCanPreviousPage() || loading}
            >
              <span className="sr-only">Go to first page</span>
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              className="h-8 w-8 p-0"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage() || loading}
            >
              <span className="sr-only">Go to previous page</span>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              className="h-8 w-8 p-0"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage() || loading}
            >
              <span className="sr-only">Go to next page</span>
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              className="hidden h-8 w-8 p-0 lg:flex"
              onClick={() => table.setPageIndex(table.getPageCount() - 1)}
              disabled={!table.getCanNextPage() || loading}
            >
              <span className="sr-only">Go to last page</span>
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
      {/* Summary Info */}
      <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground py-2">
        <div>
          Total Records:{" "}
          <span className="font-medium">{filteredData.length}</span>
        </div>
        {(dateRange.from || dateRange.to) && (
          <div>
            Date Range:{" "}
            <span className="font-medium">
              {dateRange.from && format(dateRange.from, "MMM dd, yyyy")}
              {dateRange.from && dateRange.to && " - "}
              {dateRange.to && format(dateRange.to, "MMM dd, yyyy")}
            </span>
          </div>
        )}
        {statusFilter.length > 0 && (
          <div>
            Status Filter:{" "}
            <span className="font-medium">{statusFilter.join(", ")}</span>
          </div>
        )}
      </div>
    </div>
  );
}
