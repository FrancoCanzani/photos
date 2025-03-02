import { z } from 'zod';

const cohostSchema = z.object({
  email: z.string().email('Invalid email address'),
  accessLevel: z.enum(['view', 'edit'], {
    invalid_type_error: 'Access level must be either "view" or "edit"',
  }),
});

const eventSchema = z.object({
  name: z.string().min(1, 'Event name is required'),
  date: z.date({
    required_error: 'Date is required',
    invalid_type_error: 'Invalid date format',
  }),
  location: z.string().min(1, 'Location is required'),
  description: z.string().optional(),
  cover: z.string().optional(),
  cohosts: z.array(cohostSchema).optional().default([]),
});

export { eventSchema };
