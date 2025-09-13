import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { format } from 'date-fns';
import { Calendar, MapPin, Clock, Car } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createOutOfBusinessRequest, type CreateOutOfBusinessRequest } from '@/models/request-model';

interface OutOfBusinessContentProps {
  onClose: () => void;
  onSuccess: () => void;
}

export default function OutOfBusinessContent({ onClose, onSuccess }: OutOfBusinessContentProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors }
  } = useForm<CreateOutOfBusinessRequest>({
    defaultValues: {
      employee_id: '', // Will be set from auth context
      title: '',
      description: '',
      start_date: '',
      end_date: '',
      destination: '',
      purpose: '',
      transportation_mode: '',
      estimated_cost: 0,
      client_or_company: '',
      contact_person: '',
      contact_number: ''
    }
  });

  const startDate = watch('start_date');

  // Set employee_id from auth context when component mounts
  useEffect(() => {
    // TODO: Get employee_id from auth context
    // For now using placeholder
    setValue('employee_id', 'current-user-id');
  }, [setValue]);

  const onSubmit = async (data: CreateOutOfBusinessRequest) => {
    try {
      setIsSubmitting(true);
      setError(null);

      // Validate dates
      if (new Date(data.start_date) > new Date(data.end_date)) {
        setError('End date must be after start date');
        return;
      }

      await createOutOfBusinessRequest(data);
      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit out of business request');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex items-center space-x-3 mb-6">
        <Car className="h-6 w-6 text-blue-600" />
        <h2 className="text-2xl font-bold text-gray-900">File Out of Business Request</h2>
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
              <MapPin className="h-5 w-5" />
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
                  placeholder="e.g., Client Meeting - ABC Corp"
                />
                {errors.title && (
                  <p className="text-sm text-red-600">{errors.title.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="purpose">Purpose *</Label>
                <Select onValueChange={(value) => setValue('purpose', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select purpose" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="client_meeting">Client Meeting</SelectItem>
                    <SelectItem value="business_development">Business Development</SelectItem>
                    <SelectItem value="training">Training/Workshop</SelectItem>
                    <SelectItem value="conference">Conference/Seminar</SelectItem>
                    <SelectItem value="site_visit">Site Visit</SelectItem>
                    <SelectItem value="project_work">Project Work</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
                {errors.purpose && (
                  <p className="text-sm text-red-600">{errors.purpose.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                {...register('description', { required: 'Description is required' })}
                placeholder="Provide detailed description of the business purpose..."
                rows={3}
              />
              {errors.description && (
                <p className="text-sm text-red-600">{errors.description.message}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Travel Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Calendar className="h-5 w-5" />
              <span>Travel Information</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start_date">Start Date *</Label>
                <Input
                  id="start_date"
                  type="date"
                  {...register('start_date', { required: 'Start date is required' })}
                  min={format(new Date(), 'yyyy-MM-dd')}
                />
                {errors.start_date && (
                  <p className="text-sm text-red-600">{errors.start_date.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="end_date">End Date *</Label>
                <Input
                  id="end_date"
                  type="date"
                  {...register('end_date', { required: 'End date is required' })}
                  min={startDate || format(new Date(), 'yyyy-MM-dd')}
                />
                {errors.end_date && (
                  <p className="text-sm text-red-600">{errors.end_date.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="destination">Destination *</Label>
                <Input
                  id="destination"
                  {...register('destination', { required: 'Destination is required' })}
                  placeholder="City, State/Province, Country"
                />
                {errors.destination && (
                  <p className="text-sm text-red-600">{errors.destination.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="transportation_mode">Transportation Method *</Label>
                <Select onValueChange={(value) => setValue('transportation_mode', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select transportation" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="company_vehicle">Company Vehicle</SelectItem>
                    <SelectItem value="personal_vehicle">Personal Vehicle</SelectItem>
                    <SelectItem value="public_transport">Public Transport</SelectItem>
                    <SelectItem value="flight">Flight</SelectItem>
                    <SelectItem value="train">Train</SelectItem>
                    <SelectItem value="taxi_ride_share">Taxi/Ride Share</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
                {errors.transportation_mode && (
                  <p className="text-sm text-red-600">{errors.transportation_mode.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="estimated_cost">Estimated Cost</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                <Input
                  id="estimated_cost"
                  type="number"
                  step="0.01"
                  min="0"
                  className="pl-8"
                  {...register('estimated_cost', { 
                    valueAsNumber: true,
                    min: { value: 0, message: 'Cost cannot be negative' }
                  })}
                  placeholder="0.00"
                />
              </div>
              {errors.estimated_cost && (
                <p className="text-sm text-red-600">{errors.estimated_cost.message}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Client/Contact Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Clock className="h-5 w-5" />
              <span>Contact Information</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="client_or_company">Client/Company Name</Label>
                <Input
                  id="client_or_company"
                  {...register('client_or_company')}
                  placeholder="Company or organization name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contact_person">Contact Person</Label>
                <Input
                  id="contact_person"
                  {...register('contact_person')}
                  placeholder="Primary contact name"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="contact_number">Contact Number</Label>
              <Input
                id="contact_number"
                {...register('contact_number')}
                placeholder="Phone number or other contact information..."
              />
            </div>
          </CardContent>
        </Card>

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