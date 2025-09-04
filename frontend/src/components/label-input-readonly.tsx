import { Label } from "./ui/label";
import { Input } from "./ui/input";
import { useFormContext } from "react-hook-form";

interface LabelAndInputProps {
  isReadOnly?: boolean;
  name: string; // Changed from id to name for better form handling
  label?: string;
  type?: string;
  placeholder?: string;
  required?: boolean;
  excludeFromForm?: boolean; // Don't register this field with React Hook Form
}

const LabelAndInput = ({
  isReadOnly = false,
  name,
  label,
  type = "text",
  placeholder,
  required = false,
  excludeFromForm = false,
}: LabelAndInputProps) => {
  const {
    register,
    formState: { errors },
    getValues,
  } = useFormContext();

  // Get the error for this field
  const error = errors[name];

  // Get the current value for excluded fields
  const currentValue = excludeFromForm ? getValues(name) : undefined;

  return (
    <div className="grid grid-cols-3 w-full max-w-sm items-center gap-2">
      <Label htmlFor={name} className="col-span-1">
        {label}
        {required && !isReadOnly && (
          <span className="text-red-500 ml-1">*</span>
        )}
      </Label>{" "}
      <div className="col-span-2 space-y-1">
        <Input
          {...(excludeFromForm
            ? {}
            : register(name, {
                required:
                  required && !isReadOnly ? `${label} is required` : false,
              }))}
          className={`${error ? "border-red-500" : ""}`}
          id={name}
          type={type}
          placeholder={placeholder || "--"}
          value={excludeFromForm ? currentValue || "" : undefined}
          readOnly={isReadOnly || excludeFromForm}
          disabled={isReadOnly || excludeFromForm}
        />
        {error && (
          <p className="text-sm text-red-500">{error.message as string}</p>
        )}
      </div>
    </div>
  );
};

export default LabelAndInput;
