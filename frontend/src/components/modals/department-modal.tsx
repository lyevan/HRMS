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
import { Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import type {
  Department,
  CreateDepartmentData,
  UpdateDepartmentData,
} from "@/models/department-model";
import { createDepartment, updateDepartment } from "@/models/department-model";
import { useDepartmentStore } from "@/store/departmentStore";

interface DepartmentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  department?: Department;
  mode: "create" | "edit" | "view";
  onSuccess?: () => void;
}

export function DepartmentModal({
  open,
  onOpenChange,
  department,
  mode,
  onSuccess,
}: DepartmentModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Use store actions
  const { addDepartment, updateDepartment: updateDepartmentInStore } =
    useDepartmentStore();

  useEffect(() => {
    if (open && department && (mode === "edit" || mode === "view")) {
      setFormData({
        name: department.name || "",
        description: department.description || "",
      });
    } else if (open && mode === "create") {
      setFormData({
        name: "",
        description: "",
      });
    }
    setErrors({});
  }, [open, department, mode]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Department name is required";
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
      const payload: CreateDepartmentData | UpdateDepartmentData = {
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
      };

      let result: Department;

      if (mode === "create") {
        result = await createDepartment(payload as CreateDepartmentData);
        addDepartment(result);
      } else {
        result = await updateDepartment(
          department!.department_id,
          payload as UpdateDepartmentData
        );
        updateDepartmentInStore(result);
      }

      toast.success(
        `Department ${mode === "create" ? "created" : "updated"} successfully`
      );
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      console.error(`Error ${mode}ing department:`, error);
      toast.error(`Failed to ${mode} department`);
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
            {mode === "create" && "Create New Department"}
            {mode === "edit" && "Edit Department"}
            {mode === "view" && "View Department Details"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Department Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleInputChange("name", e.target.value)}
              placeholder="Enter department name"
              disabled={isReadonly}
            />
            {errors.name && (
              <p className="text-sm text-red-500">{errors.name}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              placeholder="Enter department description (optional)"
              rows={4}
              disabled={isReadonly}
            />
          </div>

          {mode === "view" && department && (
            <div className="grid grid-cols-2 gap-4 pt-4 border-t">
              <div>
                <Label className="text-sm text-muted-foreground">Created</Label>
                <p className="text-sm">
                  {department.created_at
                    ? new Date(department.created_at).toLocaleDateString()
                    : "N/A"}
                </p>
              </div>
              <div>
                <Label className="text-sm text-muted-foreground">Updated</Label>
                <p className="text-sm">
                  {department.updated_at
                    ? new Date(department.updated_at).toLocaleDateString()
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
              {mode === "create" ? "Create Department" : "Save Changes"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
