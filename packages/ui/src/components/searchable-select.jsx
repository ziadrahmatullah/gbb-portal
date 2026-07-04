import { useState, useRef, useEffect } from "react";
import { Check, ChevronDown, Search, X } from "lucide-react";
import { cn } from "../lib/utils.js";
import { Button } from "./button.jsx";
import { Input } from "./input.jsx";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "./popover.jsx";

export function SearchableSelect({
  value,
  onChange,
  options = [],
  placeholder = "Select...",
  searchPlaceholder = "Search...",
  emptyMessage = "No results found",
  disabled = false,
  displayValue = (opt) => opt?.name || opt?.label || String(opt),
  displayValueKey = "name",
  valueKey = "id",
  required = false,
  renderOption = null,
  onSearchChange = null,
  hideClear = false,
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const triggerRef = useRef(null);

  // Sync search state with parent via onSearchChange
  useEffect(() => {
    if (onSearchChange) {
      onSearchChange(search);
    }
  }, [search, onSearchChange]);

  const filteredOptions = search
    ? options.filter((opt) => {
        const searchText = displayValue(opt).toLowerCase();
        return searchText.includes(search.toLowerCase());
      })
    : options;

  const selectedOption = options.find((opt) => String(opt[valueKey]) === String(value));

  const handleSelect = (opt) => {
    onChange(String(opt[valueKey]));
    setOpen(false);
    setSearch("");
  };

  const handleClear = (e) => {
    e.stopPropagation();
    onChange("");
    setSearch("");
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          ref={triggerRef}
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "w-full justify-between text-left font-normal h-10",
            !value && "text-muted-foreground",
            required && !value && "border-destructive"
          )}
          disabled={disabled}
        >
          {selectedOption ? (
            <span className="truncate block">{displayValue(selectedOption)}</span>
          ) : (
            <span>{placeholder}</span>
          )}
          {value && !disabled && !hideClear && (
            <X
              className="ml-2 h-4 w-4 shrink-0 opacity-50 hover:opacity-100"
              onClick={handleClear}
            />
          )}
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <div className="p-2">
          {/* Search input */}
          <div className="relative mb-2">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={searchPlaceholder}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 h-9"
              onClick={(e) => e.stopPropagation()}
            />
            {search && (
              <X
                className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground cursor-pointer"
                onClick={() => setSearch("")}
              />
            )}
          </div>

          {/* Options list */}
          <div className="max-h-60 overflow-auto">
            {filteredOptions.length === 0 ? (
              <div className="py-4 text-center text-sm text-muted-foreground">
                {emptyMessage}
              </div>
            ) : (
              <div className="space-y-1">
                {filteredOptions.map((opt) => {
                  const isSelected = String(opt[valueKey]) === String(value);
                  return (
                    <div
                      key={opt[valueKey]}
                      onClick={() => handleSelect(opt)}
                      className={cn(
                        "flex items-center gap-2 px-3 py-2 rounded-md cursor-pointer text-sm transition-colors",
                        isSelected
                          ? "bg-primary text-primary-foreground"
                          : "hover:bg-muted"
                      )}
                    >
                      <span className="flex-1 truncate">
                        {renderOption ? renderOption(opt, isSelected) : displayValue(opt)}
                      </span>
                      {isSelected && <Check className="h-4 w-4 shrink-0" />}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
