'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { createClient } from '@/lib/supabase/client';
import { Link, Trash, Copy } from 'lucide-react';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface ShareLink {
  id: string;
  access_types: string[];
  email: string | null;
  token: string;
  expires_at: string | null;
  requires_email: boolean;
  is_active: boolean;
}

interface ShareManagementProps {
  eventId: string;
  userId: string;
}

export default function ShareEvent({ eventId, userId }: ShareManagementProps) {
  const [links, setLinks] = useState<ShareLink[]>([]);
  const [loading, setLoading] = useState(false);
  const [newLink, setNewLink] = useState({
    requiresEmail: false,
    expiresIn: '',
    accessTypes: {
      view: true,
      rate: false,
      delete: false,
    },
  });
  const [customerEmail, setCustomerEmail] = useState('');

  const supabase = createClient();

  useEffect(() => {
    fetchLinks();
  }, []);

  const fetchLinks = async () => {
    const { data, error } = await supabase
      .from('links')
      .select('*')
      .eq('event_id', eventId)
      .eq('is_active', true);

    if (error) {
      toast.error('Failed to fetch share links');
    } else {
      setLinks(data || []);
    }
  };

  const handleCreateLink = async () => {
    setLoading(true);

    const accessTypes = Object.entries(newLink.accessTypes)
      .filter(([_, enabled]) => enabled)
      .map(([type]) => type);

    const { data, error } = await supabase
      .from('links')
      .insert({
        event_id: eventId,
        token: self.crypto.randomUUID(),
        access_types: accessTypes,
        requires_email: customerEmail ? true : false,
        email: customerEmail ?? null,
        expires_at: newLink.expiresIn
          ? new Date(
              Date.now() + Number.parseInt(newLink.expiresIn) * 60 * 60 * 1000
            ).toISOString()
          : null,
      })
      .select()
      .single();

    if (error) {
      toast.error('Failed to create share link');
    } else {
      setLinks([...links, data]);
      setCustomerEmail('');
      toast.success('Share link created');
    }

    setLoading(false);
  };

  const copyLink = async (token: string) => {
    const link = `${window.location.origin}/shared/${token}`;
    await navigator.clipboard.writeText(link);
    toast.success('Link copied to clipboard');
  };

  const deactivateLink = async (id: string) => {
    const { error } = await supabase
      .from('links')
      .update({ is_active: false })
      .eq('id', id);

    if (error) {
      toast.error('Failed to deactivate link');
    } else {
      setLinks(links.filter((link) => link.id !== id));
      toast.success('Link deactivated');
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant='outline' size='xs'>
          Share
        </Button>
      </DialogTrigger>
      <DialogContent className='sm:max-w-[425px]'>
        <DialogHeader>
          <DialogTitle>Share Event</DialogTitle>
        </DialogHeader>
        <Tabs defaultValue={links.length > 0 ? 'existing' : 'create'}>
          <TabsList className='grid w-full grid-cols-2'>
            <TabsTrigger value='create'>Create Link</TabsTrigger>
            <TabsTrigger value='existing'>Existing Links</TabsTrigger>
          </TabsList>
          <TabsContent value='create' className='space-y-4'>
            <div className='space-y-2'>
              <Label>Access Permissions</Label>
              <div className='space-y-2'>
                {Object.entries(newLink.accessTypes).map(([type, checked]) => (
                  <div key={type} className='flex items-center space-x-2'>
                    <Checkbox
                      id={type}
                      checked={checked}
                      onCheckedChange={(checked) =>
                        setNewLink((prev) => ({
                          ...prev,
                          accessTypes: {
                            ...prev.accessTypes,
                            [type]: !!checked,
                          },
                        }))
                      }
                    />
                    <Label htmlFor={type} className='font-normal'>
                      {type.charAt(0).toUpperCase() + type.slice(1)} photos
                    </Label>
                  </div>
                ))}
              </div>
            </div>
            <div className='space-y-2'>
              <Label htmlFor='expiresIn'>Expires in (hours) (Optional)</Label>
              <Input
                id='expiresIn'
                type='number'
                value={newLink.expiresIn}
                onChange={(e) =>
                  setNewLink((prev) => ({ ...prev, expiresIn: e.target.value }))
                }
                min='1'
                placeholder='Leave empty for no expiration'
              />
            </div>
            <div className='space-y-2'>
              <Label htmlFor='customerEmail'>Customer Email</Label>
              <Input
                id='customerEmail'
                type='email'
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                placeholder='customer@example.com'
              />
            </div>
            <Button
              className='w-full'
              onClick={handleCreateLink}
              disabled={loading}
            >
              Create Link
            </Button>
          </TabsContent>
          <TabsContent value='existing'>
            {links.length > 0 ? (
              <div className='space-y-2'>
                {links.map((link) => (
                  <div
                    key={link.id}
                    className='flex items-center justify-between pl-2 pr-1 py-1 border rounded-sm'
                  >
                    <div className='flex items-center space-x-2'>
                      <Link className='w-3 h-3' />
                      <span className='text-sm truncate w-[250px]'>
                        {link.email
                          ? `Link for ${link.email}`
                          : `Public link ${link.id}`}
                      </span>
                    </div>
                    <div className='flex items-center space-x-1.5'>
                      <Button
                        variant='ghost'
                        size='xs'
                        onClick={() => copyLink(link.token)}
                      >
                        <Copy className='w-3 h-3' />
                      </Button>
                      <Button
                        variant='ghost'
                        size='xs'
                        onClick={() => deactivateLink(link.id)}
                      >
                        <Trash className='w-3 h-3' />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className='text-center text-sm py-8 text-muted-foreground'>
                No active share links
              </p>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
