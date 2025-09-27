import {
  type ColumnDef,
  flexRender,
  type ColumnFiltersState,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  useReactTable,
} from "@tanstack/react-table";

import {
  Funnel,
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
import { useState, useEffect, useMemo } from "react";
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
import { Label } from "../ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
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
  const [isTimesheetProcessing, setIsTimesheetProcessing] = useState(false);
  const [filterInput, setFilterInput] = useState("employee_name");
  const [searchValue, setSearchValue] = useState("");
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

  const cutoffSettings = localStorage.getItem("timesheetCutoffSettings");
  const defaultCutoffType = (cutoffSettings as any)?.cutoffType;
  const defaultPeriodSelection = (cutoffSettings as any)?.periodSelection;

  // Cutoff selection states - start with null to force user selection
  const [cutoffType, setCutoffType] = useState<
    "15-EOM" | "10-25" | "5-20" | "whole-month" | "custom" | null
  >(defaultCutoffType || null);
  const [periodSelection, setPeriodSelection] = useState<
    "first-half" | "second-half" | null
  >(defaultPeriodSelection || null);
  const [selectedMonth, setSelectedMonth] = useState<number>(
    new Date().getMonth()
  ); // 0-11
  const [selectedYear, setSelectedYear] = useState<number>(
    new Date().getFullYear()
  );

  // Everytime the cutoffType and periodSelection changes save in local storage
  useEffect(() => {
    const cutoffSettings = {
      cutoffType,
      periodSelection,
    };
    localStorage.setItem(
      "timesheetCutoffSettings",
      JSON.stringify(cutoffSettings)
    );
    console.log("===Date Range From:", dateRange.from);
    console.log("===Date Range To:", dateRange.to);
  }, [cutoffType, periodSelection]);

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
      setIsTimesheetProcessing(true);
      if (selectedRecords.length === 0) {
        toast.error("No records selected for processing.");
        return;
      }

      if (!dateRange.from || !dateRange.to) {
        toast.error("Please select a valid date range.");
        return;
      }

      // Convert Date objects to UTC date strings (YYYY-MM-DD) to avoid timezone offset issues
      const formatDateString = (date: Date) => {
        const year = date.getUTCFullYear();
        const month = String(date.getUTCMonth() + 1).padStart(2, "0");
        const day = String(date.getUTCDate()).padStart(2, "0");
        return `${year}-${month}-${day}`;
      };

      const response = await axios.patch("/attendance/process-timesheet", {
        attendanceIds: selectedRecords.map((rec) => rec.attendance_id),
        startDate: formatDateString(dateRange.from),
        endDate: formatDateString(dateRange.to),
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
    } finally {
      setIsTimesheetProcessing(false);
    }
  };

  const isRecordSelected = (record: AttendanceRecord) => {
    return selectedRecords.some(
      (rec) => rec.attendance_id === record.attendance_id
    );
  };

  // Calculate date range based on cutoff type and selections
  const calculateDateRange = () => {
    // Return empty range if selections are not made
    if (!cutoffType || !periodSelection) {
      return { from: undefined, to: undefined };
    }

    const currentYear = selectedYear;
    const currentMonth = selectedMonth;
    const previousMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const previousMonthYear =
      currentMonth === 0 ? currentYear - 1 : currentYear;

    switch (cutoffType) {
      case "15-EOM":
        if (periodSelection === "first-half") {
          // 1-15 of current month - create dates at midnight UTC to avoid timezone offset
          return {
            from: new Date(Date.UTC(currentYear, currentMonth, 1)),
            to: new Date(Date.UTC(currentYear, currentMonth, 15)),
          };
        } else {
          // 16-EOM (End of Month) of current month
          return {
            from: new Date(Date.UTC(currentYear, currentMonth, 16)),
            to: new Date(Date.UTC(currentYear, currentMonth + 1, 0)), // Last day of current month
          };
        }

      case "10-25":
        if (periodSelection === "first-half") {
          // 26 of previous month to 10 of current month
          return {
            from: new Date(Date.UTC(previousMonthYear, previousMonth, 26)),
            to: new Date(Date.UTC(currentYear, currentMonth, 10)),
          };
        } else {
          // 11-25 of current month
          return {
            from: new Date(Date.UTC(currentYear, currentMonth, 11)),
            to: new Date(Date.UTC(currentYear, currentMonth, 25)),
          };
        }

      case "5-20":
        if (periodSelection === "first-half") {
          // 21 of previous month to 5 of current month
          return {
            from: new Date(Date.UTC(previousMonthYear, previousMonth, 21)),
            to: new Date(Date.UTC(currentYear, currentMonth, 5)),
          };
        } else {
          // 6-20 of current month
          return {
            from: new Date(Date.UTC(currentYear, currentMonth, 6)),
            to: new Date(Date.UTC(currentYear, currentMonth, 20)),
          };
        }

      case "whole-month":
        // Entire month: 1st to last day of selected month
        return {
          from: new Date(Date.UTC(currentYear, currentMonth, 1)),
          to: new Date(Date.UTC(currentYear, currentMonth + 1, 0)), // Last day of month
        };

      case "custom":
      default:
        return dateRange; // No additional conversion needed since dates are already normalized
    }
  };

  // Update dateRange when cutoff selections change
  const updateDateRangeFromCutoff = () => {
    if (cutoffType !== "custom") {
      const newRange = calculateDateRange();
      if (newRange.from && newRange.to) {
        setDateRange(newRange);
      }
    }
  };

  // Auto-update date range when cutoff settings change
  useEffect(() => {
    updateDateRangeFromCutoff();
  }, [cutoffType, periodSelection, selectedMonth, selectedYear]);

  // Filter data based on date range and status - using useMemo to prevent unnecessary recalculations
  const filteredData = useMemo(() => {
    return data.filter((record) => {
      // Date range filter - compare dates in UTC to avoid timezone issues
      if (dateRange.from || dateRange.to) {
        // Convert record date to UTC date string (YYYY-MM-DD)
        const recordDateUTC = new Date(record.date).toISOString().split("T")[0];
        // Convert dateRange dates to UTC date strings
        const fromDateUTC = dateRange.from?.toISOString().split("T")[0] || null;
        const toDateUTC = dateRange.to?.toISOString().split("T")[0] || null;

        if (fromDateUTC && recordDateUTC < fromDateUTC) return false;
        if (toDateUTC && recordDateUTC > toDateUTC) return false;
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

      // Search filter - use the same logic as table filtering
      if (searchValue) {
        const searchLower = searchValue.toLowerCase();
        let fieldValue = "";
        const attendanceRecord = record as AttendanceRecord;

        switch (filterInput) {
          case "employee_id":
            fieldValue = attendanceRecord.employee_id?.toString() || "";
            break;
          case "employee_name":
            fieldValue = `${attendanceRecord.first_name || ""} ${
              attendanceRecord.last_name || ""
            }`.trim();
            break;
          case "department_position":
            fieldValue = `${attendanceRecord.department_name || ""} ${
              attendanceRecord.position_title || ""
            }`.trim();
            break;
          case "date":
            fieldValue = attendanceRecord.date || "";
            break;
          case "status":
            fieldValue = getAttendanceStatusText(attendanceRecord);
            break;
          default:
            fieldValue = `${attendanceRecord.first_name || ""} ${
              attendanceRecord.last_name || ""
            }`.trim();
        }

        if (!fieldValue.toLowerCase().includes(searchLower)) {
          return false;
        }
      }

      return true;
    });
  }, [data, dateRange, statusFilter, filterInput, searchValue]);

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
    // Remove getFilteredRowModel since we handle filtering in filteredData
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
    // Reset to first page when filters change
    setPageIndex(0);
  };

  const clearDateRange = () => {
    setDateRange({ from: undefined, to: undefined });
    setCutoffType("custom"); // Reset to custom when clearing
    // Reset to first page when filters change
    setPageIndex(0);
  };

  const clearStatusFilter = () => {
    setStatusFilter([]);
    // Reset to first page when filters change
    setPageIndex(0);
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
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between w-full gap-4 mb-2 font-[Nunito]">
        {/* Search and Filter Controls */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
          <div className="flex items-center gap-2">
            <Input
              placeholder={
                !isMobile
                  ? `Filter by ${filterInput.split("_").join(" ")}...`
                  : "Filter..."
              }
              value={searchValue}
              onChange={(event) => setSearchValue(event.target.value)}
              className="w-sm"
              disabled={loading}
            />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size={"icon"} disabled={loading}>
                  <Funnel />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56 font-[Nunito]">
                <DropdownMenuLabel>Filter by:</DropdownMenuLabel>
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
                  <DropdownMenuRadioItem value="department_position">
                    Department / Position
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
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* Cutoff Period Selection */}
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
                  <span>{isMobile ? "Date" : "Select cutoff period"}</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full p-4" align="start">
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium">Cutoff Type</Label>
                  <div className="grid grid-cols-1 gap-2 mt-2">
                    <div className="flex items-center space-x-2">
                      <input
                        type="radio"
                        id="cutoff-15-eom"
                        name="cutoffType"
                        value="15-EOM"
                        checked={cutoffType === "15-EOM"}
                        onChange={(e) => setCutoffType(e.target.value as any)}
                        className="rounded"
                      />
                      <Label htmlFor="cutoff-15-eom" className="text-sm">
                        15th and End of Month
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="radio"
                        id="cutoff-10-25"
                        name="cutoffType"
                        value="10-25"
                        checked={cutoffType === "10-25"}
                        onChange={(e) => setCutoffType(e.target.value as any)}
                        className="rounded"
                      />
                      <Label htmlFor="cutoff-10-25" className="text-sm">
                        10th and 25th
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="radio"
                        id="cutoff-5-20"
                        name="cutoffType"
                        value="5-20"
                        checked={cutoffType === "5-20"}
                        onChange={(e) => setCutoffType(e.target.value as any)}
                        className="rounded"
                      />
                      <Label htmlFor="cutoff-5-20" className="text-sm">
                        5th and 20th
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="radio"
                        id="cutoff-whole-month"
                        name="cutoffType"
                        value="whole-month"
                        checked={cutoffType === "whole-month"}
                        onChange={(e) => setCutoffType(e.target.value as any)}
                        className="rounded"
                      />
                      <Label htmlFor="cutoff-whole-month" className="text-sm">
                        Whole Month
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="radio"
                        id="cutoff-custom"
                        name="cutoffType"
                        value="custom"
                        checked={cutoffType === "custom"}
                        onChange={(e) => setCutoffType(e.target.value as any)}
                        className="rounded"
                      />
                      <Label htmlFor="cutoff-custom" className="text-sm">
                        Custom Date Range
                      </Label>
                    </div>
                  </div>
                </div>

                {/* Period Selection for Cutoffs */}
                {(cutoffType === "15-EOM" ||
                  cutoffType === "10-25" ||
                  cutoffType === "5-20") && (
                  <div>
                    <Label className="text-sm font-medium">
                      Period (
                      {cutoffType === "15-EOM"
                        ? "1-15 or 16-EOM"
                        : cutoffType === "10-25"
                        ? "26-10 or 11-25"
                        : "21-5 or 6-20"}
                      )
                    </Label>
                    <div className="grid grid-cols-1 gap-2 mt-2">
                      <div className="flex items-center space-x-2">
                        <input
                          type="radio"
                          id="period-first-half"
                          name="periodSelection"
                          value="first-half"
                          checked={periodSelection === "first-half"}
                          onChange={(e) =>
                            setPeriodSelection(e.target.value as any)
                          }
                          className="rounded"
                        />
                        <Label htmlFor="period-first-half" className="text-sm">
                          {cutoffType === "15-EOM"
                            ? "1 to 15"
                            : cutoffType === "10-25"
                            ? "26 to 10"
                            : "21 to 5"}
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input
                          type="radio"
                          id="period-second-half"
                          name="periodSelection"
                          value="second-half"
                          checked={periodSelection === "second-half"}
                          onChange={(e) =>
                            setPeriodSelection(e.target.value as any)
                          }
                          className="rounded"
                        />
                        <Label htmlFor="period-second-half" className="text-sm">
                          {cutoffType === "15-EOM"
                            ? "16 to EOM"
                            : cutoffType === "10-25"
                            ? "11 to 25"
                            : "6 to 20"}
                        </Label>
                      </div>
                    </div>
                  </div>
                )}

                {/* Month Selection for Whole Month */}
                {cutoffType === "whole-month" && (
                  <div>
                    <Label className="text-sm font-medium">
                      Select Month & Year
                    </Label>
                    <div className="flex gap-2 mt-2">
                      <Select
                        value={selectedMonth.toString()}
                        onValueChange={(value) =>
                          setSelectedMonth(parseInt(value))
                        }
                      >
                        <SelectTrigger className="flex-1">
                          <SelectValue placeholder="Month" />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.from({ length: 12 }, (_, i) => (
                            <SelectItem key={i} value={i.toString()}>
                              {new Date(0, i).toLocaleString("default", {
                                month: "long",
                              })}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Select
                        value={selectedYear.toString()}
                        onValueChange={(value) =>
                          setSelectedYear(parseInt(value))
                        }
                      >
                        <SelectTrigger className="w-24">
                          <SelectValue placeholder="Year" />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.from({ length: 5 }, (_, i) => (
                            <SelectItem
                              key={i}
                              value={(
                                new Date().getFullYear() -
                                2 +
                                i
                              ).toString()}
                            >
                              {new Date().getFullYear() - 2 + i}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}

                {/* Custom Date Picker */}
                {cutoffType === "custom" && (
                  <div>
                    <Label className="text-sm font-medium">
                      Custom Date Range
                    </Label>
                    <div className="mt-2">
                      <Calendar
                        autoFocus
                        mode="range"
                        defaultMonth={dateRange.from}
                        selected={{
                          from: dateRange.from,
                          to: dateRange.to,
                        }}
                        onSelect={(range: any) => {
                          // Normalize dates to prevent timezone issues
                          const normalizeDate = (date: Date) => {
                            return new Date(
                              Date.UTC(
                                date.getFullYear(),
                                date.getMonth(),
                                date.getDate()
                              )
                            );
                          };

                          setDateRange({
                            from: range?.from
                              ? normalizeDate(range.from)
                              : undefined,
                            to: range?.to ? normalizeDate(range.to) : undefined,
                          });
                        }}
                        numberOfMonths={2}
                      />
                    </div>
                  </div>
                )}

                {/* Clear Button */}
                {(dateRange.from || dateRange.to) && (
                  <div className="pt-3 border-t">
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
              </div>
            </PopoverContent>
          </Popover>

          <Button
            variant="default"
            size={isMobile ? "icon" : "default"}
            className="bg-accent hover:bg-accent/90 cursor-pointer"
            onClick={() => handleProcessTimesheet()}
            disabled={
              loading ||
              isTimesheetProcessing ||
              !onSelectionChange ||
              selectedRecords.length === 0 ||
              !dateRange.from ||
              !dateRange.to
            }
          >
            <CalendarCog />
            Process Timesheet
          </Button>
          <Button size={"icon"} onClick={() => fetchAttendanceRecords(true)}>
            <RefreshCcw />
            {/* Refresh View */}
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
