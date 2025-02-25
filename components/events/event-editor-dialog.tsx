'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Textarea } from '@/components/ui/textarea';
import { updateEvent, type EventFormData } from '@/lib/api/actions';

interface EventEditorModalProps {
  event: EventFormData & { id: number };
}

export function EventEditorDialog({ event }: EventEditorModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState<EventFormData>({
    name: '',
    date: new Date(),
    location: '',
    notes: '',
  });
  const [errors, setErrors] = useState<
    Partial<Record<keyof EventFormData, string>>
  >({});
  const [isLoading, setIsLoading] = useState(false);

  // Initialize form data when event prop changes
  useEffect(() => {
    if (event) {
      setFormData({
        name: event.name,
        date: new Date(event.date),
        location: event.location,
        notes: event.notes || '',
      });
    }
  }, [event]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const handleDateChange = (date: Date | undefined) => {
    if (date) {
      setFormData((prev) => ({ ...prev, date }));
      setErrors((prev) => ({ ...prev, date: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Validate required fields
      const newErrors: Partial<Record<keyof EventFormData, string>> = {};
      if (!formData.name.trim()) newErrors.name = 'Name is required';
      if (!formData.location.trim())
        newErrors.location = 'Location is required';

      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
        setIsLoading(false);
        return;
      }

      const result = await updateEvent(event.id, formData);

      if (result.error) {
        toast.error('Error updating event. Try again later!');
        return;
      }

      toast.success('Event updated successfully!');
      setIsOpen(false);
    } catch (error) {
      console.error('Update error:', error);
      toast.error('Failed to update event. Try again later!');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <button className='hover:underline'>Edit</button>
      </DialogTrigger>
      <DialogContent className='sm:max-w-[425px]'>
        <DialogHeader>
          <DialogTitle>Edit Event</DialogTitle>
          <DialogDescription>
            Update the details of your event.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className='grid gap-4 py-4'>
            <div className='grid grid-cols-4 items-center gap-4'>
              <Label htmlFor='name' className='text-right'>
                Name*
              </Label>
              <div className='col-span-3'>
                <Input
                  id='name'
                  name='name'
                  value={formData.name}
                  onChange={handleInputChange}
                  className={cn(errors.name && 'border-red-500')}
                />
                {errors.name && (
                  <p className='text-red-500 text-xs mt-1'>{errors.name}</p>
                )}
              </div>
            </div>
            <div className='grid grid-cols-4 items-center gap-4'>
              <Label htmlFor='date' className='text-right'>
                Date*
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    id='date'
                    variant='outline'
                    className={cn(
                      'col-span-3 justify-start text-left font-normal flex h-9 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50',
                      !formData.date && 'text-muted-foreground',
                      errors.date && 'border-red-500'
                    )}
                  >
                    {formData.date ? (
                      format(formData.date, 'PPP')
                    ) : (
                      <span>Pick a date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className='w-auto p-0'>
                  <Calendar
                    mode='single'
                    selected={formData.date}
                    onSelect={handleDateChange}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              {errors.date && (
                <p className='text-red-500 text-xs mt-1 col-start-2 col-span-3'>
                  {errors.date}
                </p>
              )}
            </div>
            <div className='grid grid-cols-4 items-center gap-4'>
              <Label htmlFor='location' className='text-right'>
                Location*
              </Label>
              <div className='col-span-3'>
                <Input
                  id='location'
                  name='location'
                  value={formData.location}
                  onChange={handleInputChange}
                  className={cn(errors.location && 'border-red-500')}
                />
                {errors.location && (
                  <p className='text-red-500 text-xs mt-1'>{errors.location}</p>
                )}
              </div>
            </div>
            <div className='grid grid-cols-4 items-center gap-4'>
              <Label htmlFor='notes' className='text-right'>
                Notes
              </Label>
              <Textarea
                id='notes'
                name='notes'
                className='col-span-3'
                value={formData.notes}
                onChange={handleInputChange}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type='button'
              variant='outline'
              size='sm'
              onClick={() => setIsOpen(false)}
              className='mr-2'
            >
              Cancel
            </Button>
            <Button type='submit' size='sm' disabled={isLoading}>
              {isLoading ? 'Saving changes...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
