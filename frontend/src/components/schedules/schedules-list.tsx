import { useEffect } from "react";
import { Clock, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  useSchedules,
  useSchedulesLoading,
  useSchedulesError,
  useFetchSchedules,
} from "@/store/schedulesStore";
import type { Schedule } from "@/models/schedules-model";
import { Badge } from "../ui/badge";
import { getAllDaysWithScheduleStatus } from "@/lib/stringMethods";

interface SchedulesListProps {
  selectedSchedule: Schedule | null;
  onScheduleSelect: (schedule: Schedule) => void;
  onManageSchedules?: () => void;
}

export function SchedulesList({
  selectedSchedule,
  onScheduleSelect,
  onManageSchedules,
}: SchedulesListProps) {
  const schedules = useSchedules();
  const loading = useSchedulesLoading();
  const error = useSchedulesError();
  const fetchSchedules = useFetchSchedules();

  useEffect(() => {
    fetchSchedules();
  }, []); // Empty dependency array - only run once on mount

  if (loading) {
    return (
      <div className="flex items-center justify-center h-40">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
        <span className="ml-2 text-sm">Loading schedules...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <div className="text-red-500 mb-4">{error}</div>
        <Button onClick={() => fetchSchedules()} variant="outline" size="sm">
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Manage Schedules Button */}
      <div className="flex justify-end">
        <Button
          onClick={onManageSchedules}
          variant="outline"
          size="sm"
          className="gap-2"
        >
          <Settings className="w-4 h-4" />
          Manage Schedules
        </Button>
      </div>

      {/* Schedules List */}
      <div className="space-y-3">
        {schedules && schedules.length > 0 ? (
          schedules.map((schedule) => (
            <div
              key={schedule.schedule_id}
              className={`p-4 rounded-lg border cursor-pointer transition-all duration-200 hover:shadow-md ${
                selectedSchedule?.schedule_id === schedule.schedule_id
                  ? "border-primary bg-primary/5 shadow-sm"
                  : "border-muted hover:border-muted-foreground/50 hover:bg-muted/30"
              }`}
              onClick={() => onScheduleSelect(schedule)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="font-medium text-sm mb-1">
                    {schedule.schedule_name}
                  </div>
                  <div className="flex items-center text-xs text-muted-foreground mb-2">
                    <Clock className="w-3 h-3 mr-1" />
                    {schedule.start_time} - {schedule.end_time}
                  </div>
                  {schedule.days_of_week &&
                    schedule.days_of_week.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-2">
                        {getAllDaysWithScheduleStatus(
                          schedule.days_of_week
                        ).map(({ day, isScheduled }) => (
                          <Badge
                            key={day}
                            variant="outline"
                            className={`text-xs px-2 py-1 ${
                              isScheduled
                                ? "border-primary/50 text-primary bg-primary/5"
                                : "border-destructive/50 text-destructive bg-destructive/5"
                            }`}
                          >
                            {day.charAt(0).toUpperCase() + day.slice(1, 3)}
                          </Badge>
                        ))}
                      </div>
                    )}
                  <div className="text-xs text-muted-foreground">
                    {schedule.break_start && schedule.break_end
                      ? `Break: ${schedule.break_start.slice(
                          0,
                          5
                        )} - ${schedule.break_end.slice(0, 5)}`
                      : `Break: ${schedule.break_duration} minutes`}
                  </div>
                </div>
                {selectedSchedule?.schedule_id === schedule.schedule_id && (
                  <div className="w-2 h-2 rounded-full bg-primary"></div>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>No schedules available</p>
          </div>
        )}
      </div>
    </div>
  );
}
