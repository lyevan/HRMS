import { type HeaderContext } from "@tanstack/react-table";
import type { Department } from "@/models/department-model";
import { ArrowDownAZ, ArrowUpAZ, ArrowDown01, ArrowUp01 } from "lucide-react";

interface DepartmentHeadersProps<T> {
  info: HeaderContext<Department, T>;
  name: string;
  isNumber?: boolean;
}

const DepartmentHeaders = ({
  info,
  name,
  isNumber = false,
}: DepartmentHeadersProps<any>) => {
  const sorted = info.column.getIsSorted();
  return (
    <div
      onClick={(e) => {
        e.preventDefault();
        info.column.toggleSorting(info.column.getIsSorted() === "asc");
      }}
      className="cursor-pointer select-none text-primary-foreground font-black flex w-full h-full items-center justify-start"
    >
      {name}
      {/* Check first if sorted asc or desc then check if isNumber or not */}
      {sorted === "asc" ? (
        <>
          {isNumber ? (
            <ArrowDown01 className="ml-2 size-4" />
          ) : (
            <ArrowDownAZ className="ml-2 size-4" />
          )}
        </>
      ) : sorted === "desc" ? (
        <>
          {isNumber ? (
            <ArrowUp01 className="ml-2 size-4" />
          ) : (
            <ArrowUpAZ className="ml-2 size-4" />
          )}
        </>
      ) : (
        <div className="ml-2 size-3 opacity-0">--</div>
      )}
    </div>
  );
};

export default DepartmentHeaders;
