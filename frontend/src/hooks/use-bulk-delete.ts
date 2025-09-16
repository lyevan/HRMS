import { useState, useCallback } from "react";
import { toast } from "sonner";

interface UseBulkDeleteOptions<T> {
  onDelete: (items: T[]) => Promise<void>;
  getItemId: (item: T) => string | number;
  getItemName?: (item: T) => string;
  itemTypeName?: string;
}

export function useBulkDelete<T>({
  onDelete,
  getItemId,
  getItemName,
  itemTypeName = "items",
}: UseBulkDeleteOptions<T>) {
  const [selectedItems, setSelectedItems] = useState<T[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);

  const isItemSelected = useCallback(
    (item: T) => {
      const itemId = getItemId(item);
      return selectedItems.some((selected) => getItemId(selected) === itemId);
    },
    [selectedItems, getItemId]
  );

  const toggleItemSelection = useCallback(
    (item: T) => {
      const itemId = getItemId(item);
      setSelectedItems((prev) => {
        const isSelected = prev.some(
          (selected) => getItemId(selected) === itemId
        );
        if (isSelected) {
          return prev.filter((selected) => getItemId(selected) !== itemId);
        } else {
          return [...prev, item];
        }
      });
    },
    [getItemId]
  );

  const toggleAllItems = useCallback(
    (allItems: T[]) => {
      if (selectedItems.length === allItems.length) {
        setSelectedItems([]);
      } else {
        setSelectedItems(allItems);
      }
    },
    [selectedItems.length]
  );

  const clearSelection = useCallback(() => {
    setSelectedItems([]);
  }, []);

  const handleBulkDelete = useCallback(async () => {
    if (selectedItems.length === 0) {
      toast.error("No items selected for deletion");
      return;
    }

    const itemNames = getItemName
      ? selectedItems.map(getItemName).join(", ")
      : `${selectedItems.length} ${itemTypeName}`;

    const confirmed = window.confirm(
      `Are you sure you want to delete ${itemNames}? This action cannot be undone.`
    );

    if (!confirmed) return;

    setIsDeleting(true);
    try {
      await onDelete(selectedItems);
      toast.success(
        `Successfully deleted ${selectedItems.length} ${itemTypeName}`
      );
      setSelectedItems([]);
    } catch (error) {
      console.error("Bulk delete error:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : `Failed to delete ${itemTypeName}`
      );
    } finally {
      setIsDeleting(false);
    }
  }, [selectedItems, onDelete, getItemName, itemTypeName]);

  return {
    selectedItems,
    isDeleting,
    isItemSelected,
    toggleItemSelection,
    toggleAllItems,
    clearSelection,
    handleBulkDelete,
    hasSelection: selectedItems.length > 0,
    selectionCount: selectedItems.length,
  };
}
