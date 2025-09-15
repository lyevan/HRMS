import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import type {
  Position,
  CreatePositionData,
  UpdatePositionData,
} from "@/models/position-model";
import { createPosition, updatePosition } from "@/models/position-model";
import { useDepartments } from "@/store/departmentStore";
import { usePositionStore } from "@/store/positionStore";

interface PositionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  position?: Position;
  mode: "create" | "edit" | "view";
  onSuccess?: () => void;
}

export function PositionModal({
  open,
  onOpenChange,
  position,
  mode,
  onSuccess,
}: PositionModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    department_id: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const departments = useDepartments();

  // Use store actions
  const { addPosition, updatePosition: updatePositionInStore } =
    usePositionStore();

  useEffect(() => {
    if (open && position && (mode === "edit" || mode === "view")) {
      setFormData({
        title: position.title || "",
        description: position.description || "",
        department_id: position.department_id?.toString() || "",
      });
    } else if (open && mode === "create") {
      setFormData({
        title: "",
        description: "",
        department_id: "",
      });
    }
    setErrors({});
  }, [open, position, mode]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = "Position title is required";
    }

    if (!formData.department_id) {
      newErrors.department_id = "Department is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const payload: CreatePositionData | UpdatePositionData = {
        title: formData.title.trim(),
        description: formData.description.trim() || undefined,
        department_id: parseInt(formData.department_id),
      };

      let result: Position;

      if (mode === "create") {
        result = await createPosition(payload as CreatePositionData);
        addPosition(result);
      } else {
        result = await updatePosition(
          position!.position_id,
          payload as UpdatePositionData
        );
        updatePositionInStore(result);
      }

      toast.success(
        `Position ${mode === "create" ? "created" : "updated"} successfully`
      );
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      console.error(`Error ${mode}ing position:`, error);
      toast.error(`Failed to ${mode} position`);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const isReadonly = mode === "view";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {mode === "create" && "Create New Position"}
            {mode === "edit" && "Edit Position"}
            {mode === "view" && "View Position Details"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Position Title</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => handleInputChange("title", e.target.value)}
              placeholder="Enter position title"
              disabled={isReadonly}
            />
            {errors.title && (
              <p className="text-sm text-red-500">{errors.title}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="department_id">Department</Label>
            <Select
              value={formData.department_id}
              onValueChange={(value) =>
                handleInputChange("department_id", value)
              }
              disabled={isReadonly}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select department" />
              </SelectTrigger>
              <SelectContent>
                {departments.map((dept) => (
                  <SelectItem
                    key={dept.department_id}
                    value={dept.department_id.toString()}
                  >
                    {dept.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.department_id && (
              <p className="text-sm text-red-500">{errors.department_id}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              placeholder="Enter position description (optional)"
              rows={3}
              disabled={isReadonly}
            />
          </div>

          {mode === "view" && position && (
            <div className="grid grid-cols-2 gap-4 pt-4 border-t">
              <div>
                <Label className="text-sm text-muted-foreground">Created</Label>
                <p className="text-sm">
                  {position.created_at
                    ? new Date(position.created_at).toLocaleDateString()
                    : "N/A"}
                </p>
              </div>
              <div>
                <Label className="text-sm text-muted-foreground">Updated</Label>
                <p className="text-sm">
                  {position.updated_at
                    ? new Date(position.updated_at).toLocaleDateString()
                    : "N/A"}
                </p>
              </div>
            </div>
          )}
        </form>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            {mode === "view" ? "Close" : "Cancel"}
          </Button>
          {!isReadonly && (
            <Button type="submit" onClick={handleSubmit} disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <Save className="mr-2 h-4 w-4" />
              {mode === "create" ? "Create Position" : "Save Changes"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
