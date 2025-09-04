import { useFieldArray, useFormContext } from "react-hook-form";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import type { Employee } from "@/models/employee-model";

interface LeaveBalancesSectionProps {
  isReadOnly?: boolean;
}

const LeaveBalancesSection = ({
  isReadOnly = false,
}: LeaveBalancesSectionProps) => {
  const {
    control,
    register,
    formState: { errors },
  } = useFormContext<Employee>();

  const { fields } = useFieldArray({
    control,
    name: "leave_balances",
  });

  if (!fields || fields.length === 0) {
    return <p className="text-sm text-gray-500">No leave balances available</p>;
  }

  return (
    <div className="space-y-4">
      {fields.map((field, index) => {
        const leaveType = (field as any).leave_type;
        const fieldName = `leave_balances.${index}.balance` as const;
        const error = errors.leave_balances?.[index]?.balance;

        return (
          <div
            key={field.id}
            className="grid grid-cols-3 w-full max-w-sm items-center gap-2"
          >
            <Label htmlFor={fieldName} className="col-span-1">
              {leaveType}
            </Label>
            <div className="col-span-2 space-y-1">
              <Input
                {...register(fieldName, {
                  valueAsNumber: true,
                  min: { value: 0, message: "Balance cannot be negative" },
                })}
                className={`${error ? "border-red-500" : ""}`}
                id={fieldName}
                type="number"
                min="0"
                step="0.5"
                placeholder={leaveType}
                readOnly={isReadOnly}
                disabled={isReadOnly}
              />
              {error && <p className="text-sm text-red-500">{error.message}</p>}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default LeaveBalancesSection;
