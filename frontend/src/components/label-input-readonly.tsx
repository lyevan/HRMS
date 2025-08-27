import { Label } from "./ui/label";
import { Input } from "./ui/input";
import { toast } from "sonner";

interface LabelAndInputProps {
  isReadOnly?: boolean;
  id?: string;
  label?: string;
  value?: string;
  type?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}
const LabelAndInput = ({
  isReadOnly,
  id,
  label,
  value = "--",
  type = "text",
  onChange = () => {
    toast.warning("Field Editing implementing soon!");
  },
}: LabelAndInputProps) => {
  return (
    <div className="grid grid-cols-3 w-full max-w-sm items-center gap-2">
      <Label htmlFor={id} className="col-span-1">
        {label}
      </Label>
      <Input
        className="col-span-2"
        id={id}
        type={type}
        value={value}
        placeholder={label}
        readOnly={isReadOnly}
        disabled={isReadOnly}
        onChange={onChange}
      />
    </div>
  );
};

export default LabelAndInput;
