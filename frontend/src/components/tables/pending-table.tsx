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
  UserPlus,
  Download,
  Calendar,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
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
} from "../ui/dropdown-menu";
import { Button } from "../ui/button";
import { toast } from "sonner";
import { useIsMobile } from "@/hooks/use-mobile";
// import { type DateRange } from "react-day-picker";
// import { Calendar as CalendarComponent } from "@/components/ui/calendar";

interface EmployeeTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  setIsAddEmployeeModalOpen: (isOpen: boolean) => void;
}

export function PendingEmployeeTable<TData, TValue>({
  columns,
  data,
  setIsAddEmployeeModalOpen,
}: EmployeeTableProps<TData, TValue>) {
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [filterInput, setFilterInput] = useState("full_name");
  const [pageSize, setPageSize] = useState(10);
  const [pageIndex, setPageIndex] = useState(0);
  const [showRejected, setShowRejected] = useState(false);
  const isMobile = useIsMobile();
  //   const [dateRange, setDateRange] = useState<DateRange | undefined>({
  //     from: new Date(2025, 8, 15),
  //     to: new Date(2025, 9, 6),
  //   });

  // Filter data based on showRejected state
  const filteredData = showRejected
    ? data
    : data.filter((item: any) => item.status !== "rejected");

  const table = useReactTable({
    data: filteredData,
    columns,
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

  return (
    <div>
      <div className="flex items-center justify-between w-full gap-2 py-4 font-[Nunito]">
        <div className="flex items-center gap-2 w-full">
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
          />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size={"icon"}>
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
                <DropdownMenuRadioItem defaultChecked value="full_name">
                  Full Name
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="email">
                  Email
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="department_position">
                  Department & Position
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="status">
                  Status
                </DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
          <div className="flex items-center space-x-2 w-full">
            <input
              type="checkbox"
              id="show-rejected"
              checked={showRejected}
              onChange={(e) => setShowRejected(e.target.checked)}
              className="rounded"
            />
            <label
              htmlFor="show-rejected"
              className="text-sm font-medium cursor-pointer"
            >
              Show Rejected
            </label>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size={isMobile ? "icon" : "default"}
            onClick={() => setIsAddEmployeeModalOpen(true)}
          >
            <UserPlus />
            {!isMobile && "Onboard Employee"}
          </Button>
          <Button
            variant="outline"
            size={isMobile ? "icon" : "default"}
            onClick={() =>
              toast.warning("Export employee table implementation coming soon")
            }
          >
            <Download />
            {!isMobile && "Export as"}
          </Button>

          <Button
            variant="outline"
            size={isMobile ? "icon" : "default"}
            onClick={() =>
              toast.warning("Hire date filter implementation coming soon")
            }
          >
            <Calendar />
            {!isMobile && "Date Range"}
          </Button>
        </div>
      </div>
      <div className="overflow-hidden rounded-md border border-muted-foreground/30 font-[Nunito]">
        <Table>
          <TableHeader className="bg-primary text-primary-foreground border border-muted-foreground/30">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="hover:bg-primary">
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
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
            {table.getRowModel().rows?.length ? (
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
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination Controls */}
      <div className="flex items-center justify-between px-2 py-4">
        <div className="flex items-center space-x-2">
          <p className="text-sm font-medium">Rows per page</p>
          <select
            value={pageSize}
            onChange={(e) => {
              const newSize = Number(e.target.value);
              setPageSize(newSize);
              setPageIndex(0); // Reset to first page when changing page size
              table.setPageSize(newSize);
            }}
            className="h-8 w-[70px] rounded border border-input bg-background px-3 py-1 text-sm"
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
            {table.getPageCount()}
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              className="hidden h-8 w-8 p-0 lg:flex"
              onClick={() => table.setPageIndex(0)}
              disabled={!table.getCanPreviousPage()}
            >
              <span className="sr-only">Go to first page</span>
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              className="h-8 w-8 p-0"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              <span className="sr-only">Go to previous page</span>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              className="h-8 w-8 p-0"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              <span className="sr-only">Go to next page</span>
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              className="hidden h-8 w-8 p-0 lg:flex"
              onClick={() => table.setPageIndex(table.getPageCount() - 1)}
              disabled={!table.getCanNextPage()}
            >
              <span className="sr-only">Go to last page</span>
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
