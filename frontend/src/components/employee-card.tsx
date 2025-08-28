import {
  Card,
  CardAction,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuItem,
} from "./ui/dropdown-menu";
import {
  Building2,
  Ellipsis,
  Mail,
  Phone,
  UserCircle2,
  Info,
  SquarePen,
  Trash2,
  SquareArrowOutUpRight,
  Copy,
} from "lucide-react";
import { type Employee } from "@/models/employee-model";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { useCopyToClipboard } from "@/store/useCopyToClipboard";
import { useEmployees } from "@/store/employeeStore"; // Add this import

interface EmployeeCardProps {
  employee: Employee;
  setIsViewEmployeeModalOpen?: (isOpen: boolean) => void;
  setSelectedEmployee?: (employee: Employee | null) => void;
  setIsEditing?: (isEditing: boolean) => void;
}

const EmployeeCard = ({
  employee: propEmployee,
  setIsViewEmployeeModalOpen,
  setSelectedEmployee,
  setIsEditing,
}: EmployeeCardProps) => {
  const { copyToClipboard, isCopying } = useCopyToClipboard();
  const employees = useEmployees(); // Get employees from store
  
  // Find the current employee from store to get latest data (including avatar updates)
  const employee = employees.find(emp => emp.employee_id === propEmployee.employee_id) || propEmployee;
  
  const placeholderNumber = "09991234567";
  const formatPhoneNumber = (number: string) => {
    return number.replace(/(\d{4})(\d{3})(\d{4})/, "$1-$2-$3");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <div className="flex items-center">
            {employee.avatar_url ? (
              <img
                src={`${employee.avatar_url}?v=${Date.now()}`} // Add cache busting
                alt={`${employee.first_name} ${employee.last_name}`}
                className="w-10 h-10 rounded-full mr-2 object-cover object-center"
              />
            ) : (
              <UserCircle2 className="w-10 h-10 mr-2" />
            )}
            <div className="flex flex-col gap-1 max-w-40">
              <p className="font-bold text-sm line-clamp-1">
                {employee.first_name} {employee.last_name}
              </p>
              <p className="text-xs text-ring">{employee.position_title}</p>
            </div>
          </div>
        </CardTitle>
        <CardAction>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size={"icon"}>
                <Ellipsis />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="font-[Nunito]" align="start">
              <DropdownMenuItem
                onClick={() => {
                  setIsViewEmployeeModalOpen?.(true);
                  setSelectedEmployee?.(employee);
                  setIsEditing?.(false);
                }}
              >
                <span className="mr-1">
                  <Info />
                </span>
                View
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  setIsViewEmployeeModalOpen?.(true);
                  setSelectedEmployee?.(employee);
                  setIsEditing?.(true);
                }}
              >
                <span className="mr-1">
                  <SquarePen />
                </span>
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => alert(`Deleting ${employee.first_name}`)}
                variant="destructive"
              >
                <span className="mr-1">
                  <Trash2 />
                </span>
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </CardAction>
      </CardHeader>
      <div className="h-[2px] w-9/10 self-center bg-muted" />
      <CardContent className="space-y-2">
        <div className="flex items-center text-xs">
          <span className="mr-3">
            <Building2 />
          </span>
          <span>{employee.department_name}</span>
        </div>
        <div className="flex items-center text-xs group transition-opacity">
          <span className="mr-3">
            <Mail />
          </span>
          <span className="flex-1 select-all">{employee.email}</span>
          <Button
            variant={"ghost"}
            size={"icon"}
            className="opacity-0 group-hover:opacity-100 transition-all duration-200 cursor-pointer"
            onClick={() => copyToClipboard(employee.email)}
            disabled={isCopying}
            title="Copy email"
          >
            <Copy className="w-3 h-3" />
          </Button>
        </div>
        <div className="flex items-center text-xs group transition-opacity">
          <span className="mr-3">
            <Phone />
          </span>
          <span className="flex-1 select-all">
            {employee.phone
              ? formatPhoneNumber(employee.phone)
              : formatPhoneNumber(placeholderNumber)}
          </span>
          <Button
            variant={"ghost"}
            size={"icon"}
            className="opacity-0 group-hover:opacity-100 transition-all duration-200 cursor-pointer"
            onClick={() => copyToClipboard(employee.phone || placeholderNumber)}
            disabled={isCopying}
            title="Copy number"
          >
            <Copy className="w-3 h-3" />
          </Button>
        </div>
      </CardContent>
      <CardFooter>
        <div className="flex justify-between w-full items-center h-full">
          <div className="text-xs text-ring">
            <p className="font-bold">Date Hired:</p>
            <p>{new Date(employee.contract_start_date).toLocaleDateString()}</p>
          </div>
          <Badge className="bg-primary px-2 py-1.5">
            {employee.status.charAt(0).toUpperCase() + employee.status.slice(1)}
          </Badge>
          <Button
            className="text-xs"
            variant={"outline"}
            size={"icon"}
            onClick={() => {
              setIsViewEmployeeModalOpen?.(true);
              setSelectedEmployee?.(employee);
              setIsEditing?.(false);
            }}
          >
            <SquareArrowOutUpRight />
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
};

export default EmployeeCard;