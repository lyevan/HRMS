import { useState, useMemo } from "react";
import { Check, ChevronDown, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface MultiSelectOption {
  value: string;
  label: string;
  subtitle?: string;
}

interface MultiSelectComboboxProps {
  options: MultiSelectOption[];
  value: string[];
  onValueChange: (value: string[]) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  className?: string;
  disabled?: boolean;
  maxDisplayItems?: number;
}

export function MultiSelectCombobox({
  options,
  value = [],
  onValueChange,
  placeholder = "Select items...",
  searchPlaceholder = "Search...",
  className,
  disabled = false,
  maxDisplayItems = 3,
}: MultiSelectComboboxProps) {
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");

  const filteredOptions = useMemo(() => {
    if (!searchValue) return options;

    return options.filter(
      (option) =>
        option.label.toLowerCase().includes(searchValue.toLowerCase()) ||
        option.value.toLowerCase().includes(searchValue.toLowerCase()) ||
        (option.subtitle &&
          option.subtitle.toLowerCase().includes(searchValue.toLowerCase()))
    );
  }, [options, searchValue]);

  const selectedOptions = options.filter((option) =>
    value.includes(option.value)
  );

  const handleSelect = (optionValue: string) => {
    const isSelected = value.includes(optionValue);
    if (isSelected) {
      onValueChange(value.filter((v) => v !== optionValue));
    } else {
      onValueChange([...value, optionValue]);
    }
  };

  const handleRemove = (optionValue: string, event: React.MouseEvent) => {
    event.stopPropagation();
    onValueChange(value.filter((v) => v !== optionValue));
  };

  const displayedOptions = selectedOptions.slice(0, maxDisplayItems);
  const remainingCount = selectedOptions.length - maxDisplayItems;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "w-full justify-between min-h-10 h-auto p-2",
            className
          )}
          disabled={disabled}
        >
          <div className="flex flex-wrap gap-1 flex-1">
            {selectedOptions.length === 0 ? (
              <span className="text-muted-foreground">{placeholder}</span>
            ) : (
              <>
                {displayedOptions.map((option) => (
                  <Badge
                    key={option.value}
                    variant="default"
                    className="text-xs flex items-center gap-1 border-accent hover:border-destructive hover:bg-destructive/20 cursor-pointer bg-accent/60 group"
                    onClick={(e) => handleRemove(option.value, e)}
                  >
                    <span className="truncate max-w-[120px] group-hover:text-foreground">
                      {option.subtitle || option.label}
                    </span>
                    <X className="h-3 w-3 rounded-sm group-hover:text-red-600" />
                  </Badge>
                ))}
                {remainingCount > 0 && (
                  <Badge variant="outline" className="text-xs">
                    +{remainingCount} more
                  </Badge>
                )}
              </>
            )}
          </div>
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
        <div className="flex items-center border-b px-3">
          <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
          <Input
            placeholder={searchPlaceholder}
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
          />
        </div>
        <div className="max-h-60 overflow-auto">
          {filteredOptions.length === 0 ? (
            <div className="py-6 text-center text-sm">No results found.</div>
          ) : (
            <div className="p-1">
              {filteredOptions.map((option) => {
                const isSelected = value.includes(option.value);
                return (
                  <div
                    key={option.value}
                    className={cn(
                      "relative flex cursor-default select-none items-center rounded-sm px-2 py-2 text-sm outline-none hover:bg-accent hover:text-accent-foreground",
                      isSelected && "bg-accent/50"
                    )}
                    onClick={() => handleSelect(option.value)}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        isSelected ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <div className="flex flex-col flex-1">
                      <span className="font-medium">{option.label}</span>
                      {option.subtitle && (
                        <span className="text-xs text-muted-foreground">
                          {option.subtitle}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
