import { z } from 'zod';

const eventSchema = z.object({
  name: z.string().min(1, 'Event name is required'),
  date: z.date({
    required_error: 'Date is required',
    invalid_type_error: 'Invalid date format',
  }),
  location: z.string().min(1, 'Location is required'),
  description: z.string().optional(),
  cover: z.string().optional(),
});

export { eventSchema };
