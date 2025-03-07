'use client';

import { ArrowRight, Calendar, MapPin } from 'lucide-react';
import { format } from 'date-fns';
import Link from 'next/link';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from '@/components/ui/card';
import { type Event } from '@/lib/types';
import { ConfirmActionDialog } from '../confirm-action-dialog';
import { useState } from 'react';
import { deleteEvent } from '@/lib/api/actions';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

export function EventCard({ event }: { event: Event }) {
  const eventDate = event.date ? new Date(event.date) : null;
  const isUpcoming = eventDate ? eventDate > new Date() : false;
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();

  async function handleDeleteEvent(eventId: number) {
    try {
      setIsDeleting(true);
      const result = await deleteEvent(eventId);

      if (result?.error) {
        toast.error('Error deleting event. Try again later');
        return;
      }

      toast.success(`Event ${event.name} deleted succesfully`);
      router.refresh();
    } catch (error) {
      toast.error('Error deleting event. Try again later');
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <Card className='rounded-md hover:shadow space-y-3 border border-gray-100 dark:border-eerie hover:border-erie/80 transition-all duration-200 bg-background'>
      <CardHeader className='flex justify-between items-center pt-3'>
        <h3 className='text-sm font-medium'>{event.name}</h3>
        <span
          className={`text-xs px-1.5 py-0.5 rounded-md ${isUpcoming ? 'bg-blue-50 dark:bg-eerie dark:text-blue-50 text-blue-900' : 'bg-gray-50 dark:bg-eerie text-gray-500 dark:text-gray-50'}`}
        >
          {isUpcoming ? 'Upcoming' : 'Past'}
        </span>
      </CardHeader>

      <CardContent className='space-y-2'>
        <div className='flex items-center text-xs text-muted-foreground'>
          <Calendar className='w-3 h-3 mr-2' />
          <span>{eventDate ? format(eventDate, 'PPP') : 'No date set'}</span>
        </div>

        <div className='flex items-center text-xs text-muted-foreground'>
          <MapPin className='w-3 h-3 mr-2' />
          <span className='line-clamp-1'>
            {event.location || 'No location set'}
          </span>
        </div>

        {event.notes && (
          <p className='text-xs text-muted-foreground line-clamp-2'>
            {event.notes}
          </p>
        )}
      </CardContent>

      <CardFooter className='border-t bg-gray-50 dark:bg-eerie text-xs font-medium flex w-full items-center justify-between'>
        <Link
          href={`/events/${event.id}`}
          className='text-blue-500 hover:text-blue-600 dark:text-blue-50 dark:hover:text-blue-100 flex items-center group transition-all'
        >
          Moments
          <ArrowRight className='w-3 h-3 ml-0.5 group-hover:translate-x-1 transition-transform duration-200' />
        </Link>
        <div className='flex items-center justify-between space-x-2'>
          <button>Edit</button>
          <ConfirmActionDialog
            description='This will permanently delete this event and all associated moments. 
            This action cannot be undone.'
            onConfirm={() => handleDeleteEvent(event.id)}
            title='Are you absolutely sure?'
          >
            <button disabled={isDeleting}>
              {isDeleting ? 'Deleting...' : 'Delete'}
            </button>
          </ConfirmActionDialog>
        </div>
      </CardFooter>
    </Card>
  );
}
