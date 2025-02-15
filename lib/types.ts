export interface Event {
  id: number;
  user_id: string | null;
  name: string;
  date: string | null;
  location: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string | null;
}
