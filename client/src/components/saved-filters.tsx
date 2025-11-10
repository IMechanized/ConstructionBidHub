import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Save, FolderOpen, Trash2, Star } from "lucide-react";
import { SearchFilter } from "./advanced-search";
import { useToast } from "@/hooks/use-toast";

interface SavedFilter {
  id: string;
  name: string;
  filters: SearchFilter[];
  createdAt: number;
}

interface SavedFiltersProps {
  currentFilters: SearchFilter[];
  onLoadFilters: (filters: SearchFilter[]) => void;
}

const STORAGE_KEY = "rfp-saved-filters";

export function SavedFilters({ currentFilters, onLoadFilters }: SavedFiltersProps) {
  const [savedFilters, setSavedFilters] = useState<SavedFilter[]>([]);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [filterName, setFilterName] = useState("");
  const { toast } = useToast();

  // Load saved filters from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setSavedFilters(JSON.parse(stored));
      }
    } catch (error) {
      console.error("Failed to load saved filters:", error);
    }
  }, []);

  // Save filters to localStorage
  const saveToStorage = (filters: SavedFilter[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(filters));
      setSavedFilters(filters);
    } catch (error) {
      console.error("Failed to save filters:", error);
      toast({
        title: "Error",
        description: "Failed to save filter",
        variant: "destructive",
      });
    }
  };

  const handleSaveFilter = () => {
    if (!filterName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a name for your filter",
        variant: "destructive",
      });
      return;
    }

    if (currentFilters.length === 0) {
      toast({
        title: "Error",
        description: "No filters to save",
        variant: "destructive",
      });
      return;
    }

    const newFilter: SavedFilter = {
      id: Date.now().toString(),
      name: filterName,
      filters: currentFilters,
      createdAt: Date.now(),
    };

    saveToStorage([...savedFilters, newFilter]);
    setFilterName("");
    setSaveDialogOpen(false);
    
    toast({
      title: "Filter saved",
      description: `"${filterName}" has been saved successfully`,
    });
  };

  const handleLoadFilter = (filter: SavedFilter) => {
    onLoadFilters(filter.filters);
    toast({
      title: "Filter loaded",
      description: `"${filter.name}" has been applied`,
    });
  };

  const handleDeleteFilter = (filterId: string, filterName: string) => {
    const updated = savedFilters.filter(f => f.id !== filterId);
    saveToStorage(updated);
    toast({
      title: "Filter deleted",
      description: `"${filterName}" has been removed`,
    });
  };

  return (
    <div className="flex gap-2">
      <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
        <DialogTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            disabled={currentFilters.length === 0}
            data-testid="button-save-filter"
          >
            <Save className="h-4 w-4 mr-2" />
            Save Filter
          </Button>
        </DialogTrigger>
        <DialogContent data-testid="dialog-save-filter">
          <DialogHeader>
            <DialogTitle>Save Filter</DialogTitle>
            <DialogDescription>
              Give your filter a name so you can use it later.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input
              placeholder="e.g., NYC Electrical Projects"
              value={filterName}
              onChange={(e) => setFilterName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleSaveFilter();
                }
              }}
              data-testid="input-filter-name"
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setSaveDialogOpen(false)}
              data-testid="button-cancel-save"
            >
              Cancel
            </Button>
            <Button onClick={handleSaveFilter} data-testid="button-confirm-save">
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {savedFilters.length > 0 && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" data-testid="button-load-filter">
              <FolderOpen className="h-4 w-4 mr-2" />
              Saved Filters ({savedFilters.length})
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-[280px]">
            {savedFilters.map((filter) => (
              <DropdownMenuItem
                key={filter.id}
                className="flex items-center justify-between"
                onSelect={(e) => {
                  e.preventDefault();
                }}
                data-testid={`saved-filter-${filter.id}`}
              >
                <button
                  className="flex-1 text-left"
                  onClick={() => handleLoadFilter(filter)}
                >
                  <div className="flex items-center gap-2">
                    <Star className="h-4 w-4" />
                    <span>{filter.name}</span>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {filter.filters.length} filter{filter.filters.length !== 1 ? "s" : ""}
                  </div>
                </button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDeleteFilter(filter.id, filter.name)}
                  className="h-8 w-8 p-0"
                  data-testid={`button-delete-filter-${filter.id}`}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
}
