'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { createEvent, type EventFormData } from '@/lib/api/actions';
import { LocationInput } from '@/components/location-input';

export default function NewEventPage() {
  const router = useRouter();

  const [formData, setFormData] = useState<EventFormData>({
    name: '',
    date: new Date(),
    location: '',
    description: '',
  });

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleDateChange = (date: Date | undefined) => {
    if (date) {
      setFormData((prev) => ({ ...prev, date }));
    }
  };

  const handleCreateEvent = async () => {
    try {
      const result = await createEvent(formData);

      if (result.error) {
        toast.error('Error creating event. Try again later!');
        return;
      }

      toast.success('Event created successfully!');
      router.push(`/events/${result.data.id}`);
    } catch (error) {
      toast.error('Failed to create event. Try again later!');
    }
  };

  return (
    <div className='mx-auto w-full py-8 min-h-[calc(100vh-200px)] flex flex-col'>
      <div className='mb-8'>
        <h1 className='text-xl font-medium'>New Event</h1>
        <h2 className='text-muted-foreground text-sm mt-1'>
          Create a new event to store your moments
        </h2>
      </div>

      <div className='space-y-4 flex-1 w-full'>
        <div className='flex w-full items-center justify-evenly space-x-2'>
          <div className='space-y-2 w-3/4'>
            <Label htmlFor='name'>Event Name*</Label>
            <Input
              id='name'
              name='name'
              value={formData.name}
              className='h-12'
              onChange={handleInputChange}
              placeholder='Summer Party'
              required
            />
          </div>
          <div className='space-y-2 w-1/4'>
            <Label htmlFor='date'>Event Date*</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  id='date'
                  variant='outline'
                  className={cn(
                    'col-span-3 justify-start text-left font-normal flex h-12 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50',
                    !formData.date && 'text-muted-foreground'
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
                <CalendarComponent
                  mode='single'
                  selected={formData.date}
                  onSelect={handleDateChange}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        <div className='space-y-2'>
          <Label htmlFor='description'>Description</Label>
          <Textarea
            id='description'
            name='description'
            value={formData.description}
            onChange={handleInputChange}
            placeholder='Additional details about the event...'
            rows={6}
          />
        </div>

        <div className='space-y-2'>
          <LocationInput
            value={formData.location}
            onChange={(value) =>
              setFormData((prev) => ({ ...prev, location: value }))
            }
            required
            placeholder='123 Main St, City'
          />
        </div>

        <div className='flex justify-end pt-4'>
          <Button
            onClick={handleCreateEvent}
            disabled={!formData.name || !formData.location}
          >
            Save
          </Button>
        </div>
      </div>
    </div>
  );
}
