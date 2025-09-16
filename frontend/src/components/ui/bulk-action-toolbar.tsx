import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2, X } from "lucide-react";

interface BulkActionToolbarProps {
  selectedCount: number;
  onDelete: () => void;
  onClearSelection: () => void;
  isDeleting?: boolean;
  itemTypeName?: string;
}

export function BulkActionToolbar({
  selectedCount,
  onDelete,
  onClearSelection,
  isDeleting = false,
  itemTypeName = "items",
}: BulkActionToolbarProps) {
  if (selectedCount === 0) return null;

  return (
    <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg mb-4">
      <div className="flex items-center gap-3">
        <Badge variant="secondary" className="bg-blue-100 text-blue-800">
          {selectedCount} {itemTypeName} selected
        </Badge>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClearSelection}
          className="h-7 px-2 text-blue-600 hover:text-blue-800"
        >
          <X className="h-4 w-4 mr-1" />
          Clear
        </Button>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="destructive"
          size="sm"
          onClick={onDelete}
          disabled={isDeleting}
          className="h-8"
        >
          <Trash2 className="h-4 w-4 mr-1" />
          {isDeleting ? "Deleting..." : `Delete Selected`}
        </Button>
      </div>
    </div>
  );
}
