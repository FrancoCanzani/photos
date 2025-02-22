'use client';

import { useState, useEffect } from 'react';
import QRCode from 'react-qr-code';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { Link } from '@/lib/types';

interface ShareEventProps {
  eventId: string;
  links: Link[] | null;
}

export default function ShareEvent({ eventId, links }: ShareEventProps) {
  const [loading, setLoading] = useState(false);
  const [shareLink, setShareLink] = useState('');
  const [expiresIn, setExpiresIn] = useState('');
  const [existingLink, setExistingLink] = useState<Link | null>(null);
  const supabase = createClient();

  useEffect(() => {
    if (links && Array.isArray(links)) {
      const activeLink = links.find(
        (link) =>
          link.is_active &&
          (!link.expires_at || new Date(link.expires_at) > new Date())
      );

      if (activeLink) {
        setExistingLink(activeLink);
        setShareLink(`${window.location.origin}/shared/${activeLink.token}`);
      }
    }
  }, [links]);

  const handleCreateLink = async () => {
    setLoading(true);

    try {
      const expiresAt = expiresIn
        ? new Date(
            Date.now() +
              Number(expiresIn) * 60 * 60 * 1000 -
              new Date().getTimezoneOffset() * 60000
          ).toISOString()
        : null;

      const { data, error } = await supabase
        .from('links')
        .insert({
          event_id: eventId,
          token: crypto.randomUUID(),
          expires_at: expiresAt,
          is_active: true,
        })
        .select()
        .single();

      if (error) throw error;

      const link = `${window.location.origin}/shared/${data.token}`;
      setShareLink(link);
      setExistingLink(data);
      toast.success('Share link created');
    } catch (error) {
      toast.error('Failed to create share link');
    } finally {
      setLoading(false);
    }
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareLink);
      toast.success('Link copied to clipboard');
    } catch {
      toast.error('Failed to copy link');
    }
  };

  const downloadQR = () => {
    const svg = document.querySelector('#share-qr-code svg');
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx?.drawImage(img, 0, 0);

      const pngFile = canvas.toDataURL('image/png');
      const downloadLink = document.createElement('a');
      downloadLink.download = 'qr-code.png';
      downloadLink.href = pngFile;
      downloadLink.click();
    };

    img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
  };

  const disableLink = async () => {
    if (!existingLink) return;

    try {
      const { error } = await supabase
        .from('links')
        .update({ is_active: false })
        .eq('id', existingLink.id);

      if (error) throw error;

      toast.success('Link disabled');
      setExistingLink(null);
      setShareLink('');
    } catch (error) {
      toast.error('Failed to disable link');
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant='outline' size='sm'>
          Share
        </Button>
      </DialogTrigger>
      <DialogContent className='sm:max-w-md'>
        <DialogHeader>
          <DialogTitle>Take the event public</DialogTitle>
        </DialogHeader>

        <div className='space-y-6'>
          {!shareLink ? (
            <div className='space-y-4'>
              <div className='space-y-2'>
                <div className='flex items-center justify-start space-x-2'>
                  <Label htmlFor='expiresIn'>
                    Expires in (hours) (Optional)
                  </Label>
                  {expiresIn && (
                    <span className='text-xs text-muted-foreground'>{`${new Date(
                      Date.now() +
                        Number(expiresIn) * 60 * 60 * 1000 -
                        new Date().getTimezoneOffset() * 60000
                    ).toLocaleString()}`}</span>
                  )}
                </div>
                <Input
                  id='expiresIn'
                  type='number'
                  value={expiresIn}
                  onChange={(e) => setExpiresIn(e.target.value)}
                  min='1'
                  placeholder='Leave empty for no expiration'
                />
              </div>
              <Button
                className='w-full'
                onClick={handleCreateLink}
                disabled={loading || !!existingLink}
              >
                {existingLink ? 'Use Existing Link' : 'Generate Share Link'}
              </Button>
            </div>
          ) : (
            <>
              <div className='space-y-2'>
                <p className='text-muted-foreground text-sm'>
                  Anyone with this link will be able to see and download event
                  moments.
                </p>
                {existingLink?.expires_at && (
                  <p className='text-sm text-muted-foreground'>
                    Expires at:{' '}
                    {new Date(existingLink.expires_at).toLocaleString()}
                  </p>
                )}
              </div>

              <div className='flex flex-col items-center space-y-4'>
                <div id='share-qr-code' className='bg-white p-4 rounded-lg'>
                  <QRCode value={shareLink} size={200} />
                </div>
                <div className='flex items-center justify-center space-x-2'>
                  <Button variant='outline' size='sm' onClick={copyLink}>
                    Copy Link
                  </Button>
                  <Button variant='outline' size='sm' onClick={downloadQR}>
                    Download QR Code
                  </Button>
                  <Button variant='destructive' size='sm' onClick={disableLink}>
                    Disable Link
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
