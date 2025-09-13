import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { format } from 'date-fns';
import { Calendar, Clock, RotateCcw } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createChangeShiftRequest, type CreateChangeShiftRequest } from '@/models/request-model';

interface ChangeShiftContentProps {
  onClose: () => void;
  onSuccess: () => void;
}

export default function ChangeShiftContent({ onClose, onSuccess }: ChangeShiftContentProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors }
  } = useForm<CreateChangeShiftRequest>({
    defaultValues: {
      employee_id: '', // Will be set from auth context
      title: '',
      description: '',
      start_date: '',
      end_date: '',
      current_shift_start: '',
      current_shift_end: '',
      requested_shift_start: '',
      requested_shift_end: '',
      reason: '',
      is_permanent: false,
      effective_until: ''
    }
  });

  const currentShiftStart = watch('current_shift_start');
  const currentShiftEnd = watch('current_shift_end');

  // Set employee_id from auth context when component mounts
  useEffect(() => {
    // TODO: Get employee_id from auth context
    // For now using placeholder
    setValue('employee_id', 'current-user-id');
  }, [setValue]);

  const onSubmit = async (data: CreateChangeShiftRequest) => {
    try {
      setIsSubmitting(true);
      setError(null);

      // Validate shift times
      if (data.current_shift_start >= data.current_shift_end) {
        setError('Current shift end time must be after start time');
        return;
      }

      if (data.requested_shift_start >= data.requested_shift_end) {
        setError('New shift end time must be after start time');
        return;
      }

      await createChangeShiftRequest(data);
      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit shift change request');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex items-center space-x-3 mb-6">
        <RotateCcw className="h-6 w-6 text-blue-600" />
        <h2 className="text-2xl font-bold text-gray-900">Request Shift Change</h2>
      </div>

      {error && (
        <div className="p-4 border border-red-200 bg-red-50 rounded-md">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Calendar className="h-5 w-5" />
              <span>Request Details</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">Request Title *</Label>
                <Input
                  id="title"
                  {...register('title', { required: 'Title is required' })}
                  placeholder="e.g., Shift Change Request for Friday"
                />
                {errors.title && (
                  <p className="text-sm text-red-600">{errors.title.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="start_date">Date for Shift Change *</Label>
                <Input
                  id="start_date"
                  type="date"
                  {...register('start_date', { required: 'Date is required' })}
                  min={format(new Date(), 'yyyy-MM-dd')}
                />
                {errors.start_date && (
                  <p className="text-sm text-red-600">{errors.start_date.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                {...register('description', { required: 'Description is required' })}
                placeholder="Provide detailed description of your shift change request..."
                rows={3}
              />
              {errors.description && (
                <p className="text-sm text-red-600">{errors.description.message}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Current Shift Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Clock className="h-5 w-5" />
              <span>Current Shift Schedule</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="current_shift_start">Current Start Time *</Label>
                <Input
                  id="current_shift_start"
                  type="time"
                  {...register('current_shift_start', { required: 'Current start time is required' })}
                />
                {errors.current_shift_start && (
                  <p className="text-sm text-red-600">{errors.current_shift_start.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="current_shift_end">Current End Time *</Label>
                <Input
                  id="current_shift_end"
                  type="time"
                  {...register('current_shift_end', { required: 'Current end time is required' })}
                />
                {errors.current_shift_end && (
                  <p className="text-sm text-red-600">{errors.current_shift_end.message}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* New Shift Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Clock className="h-5 w-5" />
              <span>Requested New Shift Schedule</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="requested_shift_start">New Start Time *</Label>
                <Input
                  id="requested_shift_start"
                  type="time"
                  {...register('requested_shift_start', { required: 'New start time is required' })}
                />
                {errors.requested_shift_start && (
                  <p className="text-sm text-red-600">{errors.requested_shift_start.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="requested_shift_end">New End Time *</Label>
                <Input
                  id="requested_shift_end"
                  type="time"
                  {...register('requested_shift_end', { required: 'New end time is required' })}
                />
                {errors.requested_shift_end && (
                  <p className="text-sm text-red-600">{errors.requested_shift_end.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="is_permanent">Change Type</Label>
              <Select onValueChange={(value) => setValue('is_permanent', value === 'true')}>
                <SelectTrigger>
                  <SelectValue placeholder="Select change type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="false">One-time change</SelectItem>
                  <SelectItem value="true">Permanent change</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Reason */}
        <Card>
          <CardHeader>
            <CardTitle>Reason for Change</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="reason">Reason *</Label>
              <Textarea
                id="reason"
                {...register('reason', { required: 'Reason is required' })}
                placeholder="Please explain why you need this shift change (e.g., medical appointment, personal emergency, family obligations)..."
                rows={4}
              />
              {errors.reason && (
                <p className="text-sm text-red-600">{errors.reason.message}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Summary */}
        {watch('start_date') && currentShiftStart && currentShiftEnd && watch('requested_shift_start') && (
          <Card className="bg-blue-50 border-blue-200">
            <CardHeader>
              <CardTitle className="text-blue-800">Request Summary</CardTitle>
            </CardHeader>
            <CardContent className="text-blue-700">
              <p>
                <strong>Date:</strong> {format(new Date(watch('start_date')), 'MMMM d, yyyy')}
              </p>
              <p>
                <strong>Current Shift:</strong> {currentShiftStart} - {currentShiftEnd}
              </p>
              <p>
                <strong>Requested Shift:</strong> {watch('requested_shift_start')} - {watch('requested_shift_end')}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3 pt-4">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Submitting...' : 'Submit Request'}
          </Button>
        </div>
      </form>
    </div>
  );
}