import { useIsMobile } from "@/hooks/use-mobile";
import EmployeeCard from "../employee-card";
import { type Employee } from "@/models/employee-model";
import { useState } from "react";
import { Input } from "../ui/input";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu";
import { Funnel, UserPlus, Download, Calendar } from "lucide-react";
import { toast } from "sonner";
import { Button } from "../ui/button";

interface EmployeeGridProps {
  employees: Employee[];
  setIsAddEmployeeModalOpen: (open: boolean) => void;
  setIsViewEmployeeModalOpen?: (isOpen: boolean) => void;
  setSelectedEmployee?: (employee: Employee | null) => void;
  setIsEditing?: (isEditing: boolean) => void;
}

const EmployeeGrid = ({
  employees,
  setIsAddEmployeeModalOpen,
  setIsViewEmployeeModalOpen,
  setSelectedEmployee,
  setIsEditing,
}: EmployeeGridProps) => {
  const [filterInput, setFilterInput] = useState("last_name");
  const [searchQuery, setSearchQuery] = useState("");
  const isMobile = useIsMobile();

  const filteredEmployees = employees.filter((employee) => {
    if (!searchQuery) return true;

    const filterValue = (employee as any)[filterInput]
      ?.toString()
      .toLowerCase();
    return filterValue?.includes(searchQuery.toLowerCase());
  });
  return (
    <div className="flex flex-col">
      <div className="flex items-center justify-between w-full gap-2 py-4 font-[Nunito]">
        {" "}
        <div className="flex items-center gap-2 w-xs">
          <Input
            placeholder={
              !isMobile
                ? `Search by ${filterInput.split("_").join(" ")}...`
                : "Search..."
            }
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
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
                <DropdownMenuRadioItem defaultChecked value="employee_id">
                  Employee ID
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="first_name">
                  First Name
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="last_name">
                  Last Name
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="email">
                  Email
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="department_name">
                  Department
                </DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size={isMobile ? "icon" : "default"}
            onClick={() => setIsAddEmployeeModalOpen(true)}
          >
            <UserPlus />
            {!isMobile && "Add Employee"}
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
      </div>{" "}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 gap-4">
        {filteredEmployees.map((employee) => (
          <EmployeeCard
            key={employee.employee_id}
            employee={employee}
            setIsViewEmployeeModalOpen={setIsViewEmployeeModalOpen}
            setSelectedEmployee={setSelectedEmployee}
            setIsEditing={setIsEditing}
          />
        ))}
      </div>
    </div>
  );
};

export default EmployeeGrid;
