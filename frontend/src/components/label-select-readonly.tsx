import { Label } from "./ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { useFormContext, Controller } from "react-hook-form";

interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface LabelAndSelectProps {
  isReadOnly?: boolean;
  name: string;
  label?: string;
  placeholder?: string;
  required?: boolean;
  options: SelectOption[];
}

const LabelAndSelect = ({
  isReadOnly = false,
  name,
  label,
  placeholder = "Select an option",
  required = false,
  options,
}: LabelAndSelectProps) => {
  const {
    control,
    formState: { errors },
  } = useFormContext();

  // Get the error for this field
  const error = errors[name];

  return (
    <div className="grid grid-cols-3 w-full max-w-sm items-center gap-2">
      <Label htmlFor={name} className="col-span-1">
        {label}
        {required && !isReadOnly && (
          <span className="text-red-500 ml-1">*</span>
        )}
      </Label>
      <div className="col-span-2 space-y-1">
        <Controller
          name={name}
          control={control}
          rules={{
            required: required && !isReadOnly ? `${label} is required` : false,
          }}
          render={({ field }) => (
            <Select
              value={field.value || ""}
              onValueChange={field.onChange}
              disabled={isReadOnly}
            >
              <SelectTrigger
                className={`w-full ${error ? "border-red-500" : ""} ${
                  isReadOnly ? "opacity-50 pointer-events-none" : ""
                }`}
                id={name}
              >
                <SelectValue
                  placeholder={isReadOnly && !field.value ? "--" : placeholder}
                />
              </SelectTrigger>
              <SelectContent>
                {options.map((option) => (
                  <SelectItem
                    key={option.value}
                    value={option.value}
                    disabled={option.disabled}
                  >
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
        {error && (
          <p className="text-sm text-red-500">{error.message as string}</p>
        )}
      </div>
    </div>
  );
};

export default LabelAndSelect;
