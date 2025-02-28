'use client';

import { useState, useEffect } from 'react';
import QRCode from 'react-qr-code';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { Link as LinkType } from '@/lib/types';
import { Copy, Download, XCircle, ArrowLeft } from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import Link from 'next/link';

interface ShareEventClientProps {
  eventId: string;
  links: LinkType[];
  eventName: string;
}

export default function ShareEvent({
  eventId,
  links,
  eventName,
}: ShareEventClientProps) {
  const [loading, setLoading] = useState(false);
  const [shareLink, setShareLink] = useState('');
  const [expiresIn, setExpiresIn] = useState('');
  const [existingLink, setExistingLink] = useState<LinkType | null>(null);
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
      console.error(error);
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
      downloadLink.download = `${eventName.replace(/\s+/g, '-')}-qr-code.png`;
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
      console.error(error);
    }
  };

  return (
    <div className='space-y-6'>
      <Link
        href={`/events/${eventId}`}
        className='flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors'
      >
        <ArrowLeft className='w-4 h-4 mr-1' /> Back to event
      </Link>

      <Card>
        <CardHeader>
          <CardTitle>Share "{eventName}"</CardTitle>
          <CardDescription>
            Create a public link to share this event with anyone
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!shareLink ? (
            <div className='space-y-4'>
              <div className='space-y-2'>
                <div className='flex items-center justify-start space-x-2'>
                  <Label htmlFor='expiresIn'>
                    Expires in (hours) (Optional)
                  </Label>
                  {expiresIn && (
                    <span className='text-xs text-muted-foreground'>{`Expires: ${new Date(
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
              <div className='space-y-4'>
                <div className='space-y-2'>
                  <p className='text-muted-foreground'>
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

                <div className='flex flex-col items-center space-y-6 py-4'>
                  <div id='share-qr-code' className='bg-white p-4 rounded-lg'>
                    <QRCode value={shareLink} size={200} />
                  </div>

                  <div className='w-full'>
                    <div className='flex items-center space-x-2 mb-4'>
                      <Input value={shareLink} readOnly />
                      <Button
                        variant='outline'
                        size='icon'
                        onClick={copyLink}
                        title='Copy link'
                      >
                        <Copy className='w-4 h-4' />
                      </Button>
                    </div>

                    <div className='flex items-center justify-center space-x-3'>
                      <Button variant='outline' onClick={downloadQR}>
                        <Download className='w-4 h-4 mr-2' /> Download QR Code
                      </Button>
                      <Button variant='destructive' onClick={disableLink}>
                        <XCircle className='w-4 h-4 mr-2' /> Disable Link
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
