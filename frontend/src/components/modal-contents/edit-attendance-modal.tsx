import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Save, X } from "lucide-react";
import type { AttendanceRecord } from "@/models/attendance-model";

interface EditModalContentProps {
  selectedRecord: AttendanceRecord | null;
  editForm: any;
  setEditForm: (form: any) => void;
  handleUpdateAttendance: () => void;
  handleCloseModals: () => void;
  isUpdating: boolean;
}

export const editModalContent = ({
  selectedRecord,
  editForm,
  setEditForm,
  handleUpdateAttendance,
  handleCloseModals,
  isUpdating,
}: EditModalContentProps) => {
  if (!selectedRecord) return null;

  return (
    <div className="space-y-6">
      <DialogHeader>
        <DialogTitle>Edit Attendance Record</DialogTitle>
        <p className="text-sm text-muted-foreground">
          Employee:{" "}
          <span className="text-accent">
            {selectedRecord.first_name} {selectedRecord.last_name} (
            {selectedRecord.employee_id})
          </span>
        </p>
        <DialogDescription>
          <span className="text-muted-foreground">
            For Date:{" "}
            <span className="text-accent">
              {new Date(selectedRecord.date).toLocaleDateString(undefined, {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </span>
          </span>
        </DialogDescription>
      </DialogHeader>

      <div className="grid grid-cols-1 gap-6">
        {/* Time Information */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Edit Attendance Times</h3>
          <p className="text-sm text-muted-foreground">
            Only time in and time out can be modified. All calculations will be
            automatically recalculated.
          </p>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="time_in">Time In *</Label>
              <Input
                id="time_in"
                type="time"
                value={editForm.time_in}
                onChange={(e) =>
                  setEditForm({ ...editForm, time_in: e.target.value })
                }
                required
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="time_out">Time Out *</Label>
              <Input
                id="time_out"
                type="time"
                value={editForm.time_out}
                onChange={(e) =>
                  setEditForm({ ...editForm, time_out: e.target.value })
                }
                required
              />
            </div>
          </div>

          <div className="text-sm text-muted-foreground">
            <p>• Time difference must be less than 20 hours</p>
            <p>• Time out must be after time in</p>
            <p>• All payroll calculations will be automatically recalculated</p>
          </div>
        </div>
      </div>

      <DialogFooter>
        <Button variant="outline" onClick={handleCloseModals}>
          <X className="h-4 w-4 mr-2" />
          Cancel
        </Button>
        <Button onClick={handleUpdateAttendance} disabled={isUpdating}>
          <Save className="h-4 w-4 mr-2" />
          {isUpdating ? "Saving..." : "Save Changes"}
        </Button>
      </DialogFooter>
    </div>
  );
};
