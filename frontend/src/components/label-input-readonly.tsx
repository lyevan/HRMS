import { Label } from "./ui/label";
import { Input } from "./ui/input";
import { useFormContext } from "react-hook-form";
import { CalendarIcon } from "lucide-react";

interface LabelAndInputProps {
  isReadOnly?: boolean;
  name: string; // Changed from id to name for better form handling
  label?: string;
  type?: string;
  placeholder?: string;
  required?: boolean;
  excludeFromForm?: boolean; // Don't register this field with React Hook Form
  displayValue?: string; // Optional formatted value for read-only display
}

const LabelAndInput = ({
  isReadOnly = false,
  name,
  label,
  type = "text",
  placeholder,
  required = false,
  excludeFromForm = false,
  displayValue, // Optional formatted value for read-only display
}: LabelAndInputProps) => {
  const {
    register,
    formState: { errors },
    getValues,
  } = useFormContext();

  // Get the error for this field
  const error = errors[name];

  // Get the current value for excluded fields
  const currentValue = excludeFromForm ? getValues(name) : undefined; // Handle value transformation and display logic for non-date fields
  const getInputProps = () => {
    if (isReadOnly || excludeFromForm) {
      // For read-only or excluded fields, use the formatted display value
      const valueToShow =
        isReadOnly && displayValue !== undefined
          ? displayValue
          : excludeFromForm
          ? currentValue || ""
          : "";

      return {
        value: valueToShow,
        readOnly: true,
        disabled: true,
        type: "text", // Always use text type for read-only to show formatted values
      };
    } else {
      // For regular fields (non-date), use standard registration
      return register(name, {
        required: required && !isReadOnly ? `${label} is required` : false,
      });
    }
  };
  return (
    <div className="grid grid-cols-3 w-full max-w-sm items-center gap-2">
      <Label htmlFor={name} className="col-span-1">
        {label}
        {required && !isReadOnly && (
          <span className="text-red-500 ml-1">*</span>
        )}
      </Label>{" "}
      <div className="col-span-2 space-y-1">
        {" "}
        {type === "date" && !isReadOnly && !excludeFromForm ? (
          // Custom styled date input
          <div className="relative group date-input-wrapper">
            {" "}
            <Input
              {...register(name, {
                required:
                  required && !isReadOnly ? `${label} is required` : false,
                setValueAs: (value: string) => {
                  // When the date input changes, keep it as YYYY-MM-DD format
                  // Don't convert to ISO to avoid timezone issues
                  return value;
                },
              })}
              type="date"
              className={`
                ${
                  error
                    ? "border-red-500"
                    : "border-input focus:border-primary focus:ring-1 focus:ring-primary"
                }
                pr-10 pl-3 py-2
                rounded-md
                text-sm
                transition-all duration-200
          
                focus:outline-none
                focus:shadow-sm
                [&::-webkit-calendar-picker-indicator]:opacity-0
                [&::-webkit-calendar-picker-indicator]:absolute
                [&::-webkit-calendar-picker-indicator]:right-0
                [&::-webkit-calendar-picker-indicator]:w-10
                [&::-webkit-calendar-picker-indicator]:h-full
                [&::-webkit-calendar-picker-indicator]:cursor-pointer
                [&::-webkit-calendar-picker-indicator]:z-10
                [&::-webkit-inner-spin-button]:appearance-none
                [&::-webkit-clear-button]:appearance-none
              `}
              style={{
                colorScheme: "light",
              }}
              id={name}
              placeholder={placeholder || "Select date"}
            />
            <CalendarIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-foreground pointer-events-none z-5 calendar-icon" />
          </div>
        ) : (
          // Regular input for non-date fields or read-only/excluded fields
          <Input
            {...getInputProps()}
            className={`${error ? "border-red-500" : ""}`}
            id={name}
            placeholder={placeholder || "--"}
          />
        )}
        {error && (
          <p className="text-sm text-red-500">{error.message as string}</p>
        )}
      </div>
    </div>
  );
};

export default LabelAndInput;
