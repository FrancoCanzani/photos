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

export type Link = {
  id: number;
  event_id: number;
  expires_at: string | null;
  created_at: string;
  last_used_at: string;
  times_used: number;
  is_active: boolean;
  token: string;
};
