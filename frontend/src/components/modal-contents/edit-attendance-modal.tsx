import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DialogHeader,
  DialogTitle,
  DialogFooter,
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
          Employee: {selectedRecord.first_name} {selectedRecord.last_name} (
          {selectedRecord.employee_id})
        </p>
      </DialogHeader>

      <div className="grid grid-cols-1 gap-6">
        {/* Basic Information */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Basic Information</h3>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                value={editForm.date}
                onChange={(e) =>
                  setEditForm({ ...editForm, date: e.target.value })
                }
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="time_in">Time In</Label>
              <Input
                id="time_in"
                type="datetime-local"
                value={editForm.time_in}
                onChange={(e) =>
                  setEditForm({ ...editForm, time_in: e.target.value })
                }
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="time_out">Time Out</Label>
              <Input
                id="time_out"
                type="datetime-local"
                value={editForm.time_out}
                onChange={(e) =>
                  setEditForm({ ...editForm, time_out: e.target.value })
                }
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="total_hours">Total Hours</Label>
              <Input
                id="total_hours"
                type="number"
                step="0.01"
                placeholder="8.00"
                value={editForm.total_hours}
                onChange={(e) =>
                  setEditForm({
                    ...editForm,
                    total_hours: e.target.value,
                  })
                }
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="overtime_hours">Overtime Hours</Label>
              <Input
                id="overtime_hours"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={editForm.overtime_hours}
                onChange={(e) =>
                  setEditForm({
                    ...editForm,
                    overtime_hours: e.target.value,
                  })
                }
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              placeholder="Additional notes..."
              value={editForm.notes}
              onChange={(e) =>
                setEditForm({ ...editForm, notes: e.target.value })
              }
              rows={3}
            />
          </div>
        </div>

        {/* Status Flags */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Attendance Status</h3>

          <div className="space-y-3">
            <h4 className="text-sm font-medium text-muted-foreground">
              Primary Status
            </h4>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="is_present"
                  checked={editForm.is_present}
                  onCheckedChange={(checked) =>
                    setEditForm({
                      ...editForm,
                      is_present: checked as boolean,
                    })
                  }
                />
                <Label htmlFor="is_present" className="text-sm font-medium">
                  Present
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="is_absent"
                  checked={editForm.is_absent}
                  onCheckedChange={(checked) =>
                    setEditForm({
                      ...editForm,
                      is_absent: checked as boolean,
                    })
                  }
                />
                <Label htmlFor="is_absent" className="text-sm font-medium">
                  Absent
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="on_leave"
                  checked={editForm.on_leave}
                  onCheckedChange={(checked) =>
                    setEditForm({
                      ...editForm,
                      on_leave: checked as boolean,
                    })
                  }
                />
                <Label htmlFor="on_leave" className="text-sm font-medium">
                  On Leave
                </Label>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="text-sm font-medium text-muted-foreground">
              Secondary Status
            </h4>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="is_late"
                  checked={editForm.is_late}
                  onCheckedChange={(checked) =>
                    setEditForm({
                      ...editForm,
                      is_late: checked as boolean,
                    })
                  }
                />
                <Label htmlFor="is_late" className="text-sm font-medium">
                  Late
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="is_undertime"
                  checked={editForm.is_undertime}
                  onCheckedChange={(checked) =>
                    setEditForm({
                      ...editForm,
                      is_undertime: checked as boolean,
                    })
                  }
                />
                <Label htmlFor="is_undertime" className="text-sm font-medium">
                  Undertime
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="is_halfday"
                  checked={editForm.is_halfday}
                  onCheckedChange={(checked) =>
                    setEditForm({
                      ...editForm,
                      is_halfday: checked as boolean,
                    })
                  }
                />
                <Label htmlFor="is_halfday" className="text-sm font-medium">
                  Half Day
                </Label>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="text-sm font-medium text-muted-foreground">
              Special Days
            </h4>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="is_dayoff"
                  checked={editForm.is_dayoff}
                  onCheckedChange={(checked) =>
                    setEditForm({
                      ...editForm,
                      is_dayoff: checked as boolean,
                    })
                  }
                />
                <Label htmlFor="is_dayoff" className="text-sm font-medium">
                  Day Off
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="is_regular_holiday"
                  checked={editForm.is_regular_holiday}
                  onCheckedChange={(checked) =>
                    setEditForm({
                      ...editForm,
                      is_regular_holiday: checked as boolean,
                    })
                  }
                />
                <Label
                  htmlFor="is_regular_holiday"
                  className="text-sm font-medium"
                >
                  Regular Holiday
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="is_special_holiday"
                  checked={editForm.is_special_holiday}
                  onCheckedChange={(checked) =>
                    setEditForm({
                      ...editForm,
                      is_special_holiday: checked as boolean,
                    })
                  }
                />
                <Label
                  htmlFor="is_special_holiday"
                  className="text-sm font-medium"
                >
                  Special Holiday
                </Label>
              </div>
            </div>
          </div>

          <div className="space-y-3 py-2">
            <h3 className="text-lg font-medium">Leave Information</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-2">
                <Label htmlFor="leave_type_id">Leave Type ID</Label>
                <Input
                  id="leave_type_id"
                  type="number"
                  placeholder="Leave type ID"
                  value={editForm.leave_type_id}
                  onChange={(e) =>
                    setEditForm({
                      ...editForm,
                      leave_type_id: e.target.value,
                    })
                  }
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="leave_request_id">Leave Request ID</Label>
                <Input
                  id="leave_request_id"
                  type="number"
                  placeholder="Leave request ID"
                  value={editForm.leave_request_id}
                  onChange={(e) =>
                    setEditForm({
                      ...editForm,
                      leave_request_id: e.target.value,
                    })
                  }
                />
              </div>
            </div>
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
