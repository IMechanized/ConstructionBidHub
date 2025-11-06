import { useState, useEffect } from "react";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, MapPin, Briefcase, Award, X } from "lucide-react";
import { US_STATES_AND_TERRITORIES } from "@/lib/utils";
import { CERTIFICATIONS, TRADE_OPTIONS } from "@shared/schema";

export interface SearchFilter {
  type: "location" | "trade" | "certification" | "text";
  value: string;
  label: string;
}

interface AdvancedSearchProps {
  filters: SearchFilter[];
  onFiltersChange: (filters: SearchFilter[]) => void;
  onSearch?: (searchTerm: string) => void;
}

export function AdvancedSearch({ filters, onFiltersChange, onSearch }: AdvancedSearchProps) {
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");

  const addFilter = (filter: SearchFilter) => {
    const exists = filters.some(
      f => f.type === filter.type && f.value === filter.value
    );
    if (!exists) {
      onFiltersChange([...filters, filter]);
    }
    setOpen(false);
    setSearchValue("");
  };

  const removeFilter = (index: number) => {
    onFiltersChange(filters.filter((_, i) => i !== index));
  };

  const clearAll = () => {
    onFiltersChange([]);
  };

  const getIcon = (type: SearchFilter["type"]) => {
    switch (type) {
      case "location":
        return <MapPin className="h-3 w-3" />;
      case "trade":
        return <Briefcase className="h-3 w-3" />;
      case "certification":
        return <Award className="h-3 w-3" />;
      default:
        return <Search className="h-3 w-3" />;
    }
  };

  // Collect all options for search
  const searchOptions = [
    ...US_STATES_AND_TERRITORIES.map(loc => ({
      type: "location" as const,
      value: loc,
      label: loc,
      category: "Locations",
    })),
    ...TRADE_OPTIONS.map(trade => ({
      type: "trade" as const,
      value: trade,
      label: trade,
      category: "Trades",
    })),
    ...CERTIFICATIONS.filter(cert => cert !== "None").map(cert => ({
      type: "certification" as const,
      value: cert,
      label: cert,
      category: "Certifications",
    })),
  ];

  // Filter options based on search value
  const filteredOptions = searchValue
    ? searchOptions.filter(option =>
        option.label.toLowerCase().includes(searchValue.toLowerCase())
      )
    : searchOptions;

  // Group by category
  const groupedOptions = filteredOptions.reduce((acc, option) => {
    if (!acc[option.category]) {
      acc[option.category] = [];
    }
    acc[option.category].push(option);
    return acc;
  }, {} as Record<string, typeof searchOptions>);

  return (
    <div className="space-y-2">
      <div className="flex gap-2 items-center flex-wrap">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className="justify-between"
              data-testid="button-advanced-search"
            >
              <Search className="h-4 w-4 mr-2" />
              Add filter...
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[400px] p-0" align="start">
            <Command>
              <CommandInput
                placeholder="Search locations, trades, certifications..."
                value={searchValue}
                onValueChange={setSearchValue}
                data-testid="input-filter-search"
              />
              <CommandList>
                <CommandEmpty>No results found.</CommandEmpty>
                {Object.entries(groupedOptions).map(([category, options]) => (
                  <CommandGroup key={category} heading={category}>
                    {options.slice(0, 10).map(option => (
                      <CommandItem
                        key={`${option.type}-${option.value}`}
                        value={`${option.type}-${option.value}`}
                        onSelect={() => addFilter(option)}
                        data-testid={`option-${option.type}-${option.value}`}
                      >
                        {getIcon(option.type)}
                        <span className="ml-2">{option.label}</span>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                ))}
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>

        {filters.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearAll}
            data-testid="button-clear-filters"
          >
            Clear all
          </Button>
        )}
      </div>

      {filters.length > 0 && (
        <div className="flex gap-2 flex-wrap" data-testid="active-filters">
          {filters.map((filter, index) => (
            <Badge
              key={index}
              variant="secondary"
              className="pl-2 pr-1 py-1"
              data-testid={`filter-badge-${index}`}
            >
              <span className="flex items-center gap-1">
                {getIcon(filter.type)}
                <span className="text-xs">{filter.label}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-4 w-4 p-0 ml-1 hover:bg-transparent"
                  onClick={() => removeFilter(index)}
                  data-testid={`button-remove-filter-${index}`}
                >
                  <X className="h-3 w-3" />
                </Button>
              </span>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
