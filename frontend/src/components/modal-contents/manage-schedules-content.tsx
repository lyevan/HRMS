import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, Clock, Save, X, Coffee } from "lucide-react";
import { toast } from "sonner";
import {
  useSchedules,
  useSchedulesLoading,
  useSchedulesError,
  useFetchSchedules,
  useAddSchedule,
  useEditSchedule,
  useRemoveSchedule,
} from "@/store/schedulesStore";
import { type Schedule } from "@/models/schedules-model";

interface ScheduleFormData {
  schedule_name: string;
  start_time: string;
  end_time: string;
  break_duration: number;
  days_of_week: string[];
}

const DAYS_OF_WEEK = [
  { value: "monday", label: "Mon" },
  { value: "tuesday", label: "Tue" },
  { value: "wednesday", label: "Wed" },
  { value: "thursday", label: "Thu" },
  { value: "friday", label: "Fri" },
  { value: "saturday", label: "Sat" },
  { value: "sunday", label: "Sun" },
];

export function ManageSchedulesContent() {
  const schedules = useSchedules();
  const loading = useSchedulesLoading();
  const error = useSchedulesError();
  const fetchSchedules = useFetchSchedules();
  const addSchedule = useAddSchedule();
  const editSchedule = useEditSchedule();
  const removeSchedule = useRemoveSchedule();

  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState<ScheduleFormData>({
    schedule_name: "",
    start_time: "",
    end_time: "",
    break_duration: 60,
    days_of_week: [],
  });

  useEffect(() => {
    fetchSchedules();
  }, []);

  const resetForm = () => {
    setFormData({
      schedule_name: "",
      start_time: "",
      end_time: "",
      break_duration: 60,
      days_of_week: [],
    });
    setIsCreating(false);
    setEditingId(null);
  };

  const handleStartCreate = () => {
    resetForm();
    setIsCreating(true);
  };

  const handleStartEdit = (schedule: Schedule) => {
    setFormData({
      schedule_name: schedule.schedule_name,
      start_time: schedule.start_time,
      end_time: schedule.end_time,
      break_duration: schedule.break_duration,
      days_of_week: schedule.days_of_week || [],
    });
    setEditingId(schedule.schedule_id);
    setIsCreating(false);
  };

  const handleDayToggle = (day: string) => {
    setFormData((prev) => ({
      ...prev,
      days_of_week: prev.days_of_week.includes(day)
        ? prev.days_of_week.filter((d) => d !== day)
        : [...prev.days_of_week, day],
    }));
  };

  const handleSubmit = async () => {
    if (!formData.schedule_name.trim()) {
      toast.warning("Schedule name is required");
      return;
    }
    if (!formData.start_time || !formData.end_time) {
      toast.warning("Start time and end time are required");
      return;
    }

    try {
      if (editingId) {
        await editSchedule(editingId, formData);
        toast.success("Schedule updated successfully");
      } else {
        await addSchedule(formData);
        toast.success("Schedule created successfully");
      }
      resetForm();
    } catch (error) {
      toast.error(
        editingId ? "Failed to update schedule" : "Failed to create schedule"
      );
    }
  };

  const handleDelete = async (schedule: Schedule) => {
    if (
      window.confirm(
        `Are you sure you want to delete "${schedule.schedule_name}"?`
      )
    ) {
      try {
        await removeSchedule(schedule.schedule_id);
        toast.success("Schedule deleted successfully");
      } catch (error) {
        toast.error("Failed to delete schedule");
      }
    }
  };

  if (loading && schedules.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <span className="ml-2">Loading schedules...</span>
      </div>
    );
  }

  return (
    <div>
      <div className="space-y-6">
        {/* Header with Add Button */}
        <div className="flex items-center justify-between">
          <Button
            onClick={handleStartCreate}
            disabled={isCreating || editingId !== null}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Schedule
          </Button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        {/* Create/Edit Form */}
        {(isCreating || editingId !== null) && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                {editingId ? "Edit Schedule" : "Create New Schedule"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="schedule_name">Schedule Name</Label>
                  <Input
                    id="schedule_name"
                    value={formData.schedule_name}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        schedule_name: e.target.value,
                      }))
                    }
                    placeholder="e.g., Day Shift, Night Shift"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="break_duration">
                    Break Duration (minutes)
                  </Label>
                  <Input
                    id="break_duration"
                    type="number"
                    value={formData.break_duration}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        break_duration: parseInt(e.target.value) || 0,
                      }))
                    }
                    min="0"
                    max="480"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="start_time">Start Time</Label>
                  <Input
                    id="start_time"
                    type="time"
                    value={formData.start_time}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        start_time: e.target.value,
                      }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="end_time">End Time</Label>
                  <Input
                    id="end_time"
                    type="time"
                    value={formData.end_time}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        end_time: e.target.value,
                      }))
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Working Days</Label>
                <div className="flex flex-wrap gap-2">
                  {DAYS_OF_WEEK.map((day) => (
                    <Button
                      key={day.value}
                      variant={
                        formData.days_of_week.includes(day.value)
                          ? "default"
                          : "outline"
                      }
                      size="sm"
                      onClick={() => handleDayToggle(day.value)}
                      type="button"
                    >
                      {day.label}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={resetForm}>
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
                <Button onClick={handleSubmit} disabled={loading}>
                  <Save className="w-4 h-4 mr-2" />
                  {editingId ? "Update" : "Create"} Schedule
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Schedules List */}
        <div className="space-y-4">
          {schedules.length === 0 && !loading ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-8">
                <Clock className="w-12 h-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No schedules found</p>
                <p className="text-sm text-muted-foreground">
                  Create your first schedule to get started
                </p>
              </CardContent>
            </Card>
          ) : (
            schedules.map((schedule) => (
              <Card key={schedule.schedule_id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="font-semibold">
                          {schedule.schedule_name}
                        </h4>
                        <Badge
                          variant="outline"
                          className="flex items-center gap-1"
                        >
                          <Clock className="w-3 h-3" />
                          {schedule.start_time} - {schedule.end_time}
                        </Badge>
                        <Badge
                          variant="outline"
                          className="flex items-center gap-1"
                        >
                          <Coffee className="w-3 h-3" />
                          {schedule.break_duration}min break
                        </Badge>
                      </div>

                      {schedule.days_of_week &&
                        schedule.days_of_week.length > 0 && (
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground">
                              Working days:
                            </span>
                            <div className="flex gap-1">
                              {schedule.days_of_week.map((day) => (
                                <Badge
                                  key={day}
                                  variant="secondary"
                                  className="text-xs"
                                >
                                  {DAYS_OF_WEEK.find((d) => d.value === day)
                                    ?.label || day}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleStartEdit(schedule)}
                        disabled={isCreating || editingId !== null}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(schedule)}
                        disabled={isCreating || editingId !== null}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
