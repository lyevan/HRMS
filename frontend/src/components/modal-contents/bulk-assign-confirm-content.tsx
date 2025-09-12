import { Button } from "@/components/ui/button";
import { Users } from "lucide-react";
import { type Employee } from "@/models/employee-model";
import { type Schedule } from "@/models/schedules-model";

interface BulkAssignConfirmContentProps {
  onConfirm: () => void;
  selectedEmployees: Employee[];
  selectedSchedule: Schedule;
  isLoading?: boolean;
}

export function BulkAssignConfirmContent({
  onConfirm,
  selectedEmployees,
  selectedSchedule,
  isLoading = false,
}: BulkAssignConfirmContentProps) {
  return (
    <div className="space-y-6">
      {/* Schedule Info */}
      <div className="bg-primary/5 rounded-lg p-4 border border-primary/20">
        <h4 className="font-medium text-primary mb-2">Selected Schedule</h4>
        <div className="text-lg font-semibold">
          {selectedSchedule.schedule_name}
        </div>
        <div className="text-sm text-muted-foreground mt-1">
          {selectedSchedule.start_time} - {selectedSchedule.end_time} • Break:{" "}
          {selectedSchedule.break_duration} min
        </div>
      </div>

      {/* Employee Count */}
      <div className="flex items-center gap-2 text-sm">
        <Users className="w-4 h-4 text-muted-foreground" />
        <span className="font-medium">
          {selectedEmployees.length} employee
          {selectedEmployees.length !== 1 ? "s" : ""} will be assigned to this
          schedule:
        </span>
      </div>

      {/* Employee List */}
      <div className="border rounded-lg">
        <div className="h-64 overflow-y-auto">
          <div className="p-4 space-y-2">
            {selectedEmployees.map((employee, index) => (
              <div
                key={employee.employee_id}
                className={`flex items-center justify-between p-3 rounded-md transition-colors ${
                  index % 2 === 0 ? "bg-muted/30" : "bg-background"
                } hover:bg-muted/50`}
              >
                <div>
                  <div className="font-medium">
                    {employee.first_name} {employee.last_name}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    ID: {employee.employee_id} • {employee.department_name} •{" "}
                    {employee.position_title}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Warning */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="text-sm text-yellow-800">
          <strong>Note:</strong> This action will update the schedule for all
          selected employees. Any existing schedule assignments will be
          replaced.
        </div>
      </div>

      {/* Footer Actions */}
      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button
          onClick={onConfirm}
          disabled={isLoading}
          className="min-w-[120px]"
        >
          {isLoading ? (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Assigning...
            </div>
          ) : (
            "Confirm Assignment"
          )}
        </Button>
      </div>
    </div>
  );
}
