'use client';

import { useState } from 'react';
import { Label } from '../ui/label';
import { Switch } from '../ui/switch';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Calendar } from '../ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { CalendarIcon, Copy, Download } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import QRCodeSVG from 'react-qr-code';

export default function ShareEvent({
  eventId,
  links,
  eventName,
}: {
  eventId: string;
  links: any[];
  eventName: string;
}) {
  const [hasPublicLink, setHasPublicLink] = useState(false);
  const [hasEditorLink, setHasEditorLink] = useState(false);
  const [publicPinCode, setPublicPinCode] = useState('');
  const [editorPinCode, setEditorPinCode] = useState('');
  const [publicExpiryDate, setPublicExpiryDate] = useState<Date | undefined>(
    undefined
  );
  const [editorExpiryDate, setEditorExpiryDate] = useState<Date | undefined>(
    undefined
  );

  const publicUrl = `https://${process.env.VERCEL_URL ?? 'http://localhost:3000'}/events/gallery/${window.crypto.randomUUID()}`;
  const editorUrl = `https://${process.env.VERCEL_URL ?? 'http://localhost:3000'}/events/${eventId}`;

  const downloadQRCode = (type: 'public' | 'editor') => {
    const svg = document.getElementById(`${type}-qr-code`);
    if (svg) {
      // Create a canvas element
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      // Create an image from the SVG
      const img = new Image();
      const svgData = new XMLSerializer().serializeToString(svg);
      const svgBlob = new Blob([svgData], {
        type: 'image/svg+xml;charset=utf-8',
      });
      const url = URL.createObjectURL(svgBlob);

      img.onload = () => {
        // Set canvas dimensions
        canvas.width = img.width;
        canvas.height = img.height;

        // Draw white background
        if (ctx) {
          ctx.fillStyle = 'white';
          ctx.fillRect(0, 0, canvas.width, canvas.height);

          // Draw the image
          ctx.drawImage(img, 0, 0);

          // Convert to PNG and download
          const pngUrl = canvas.toDataURL('image/png');
          const downloadLink = document.createElement('a');
          downloadLink.href = pngUrl;
          downloadLink.download = `${eventName}-${type}-qr-code.png`;
          document.body.appendChild(downloadLink);
          downloadLink.click();
          document.body.removeChild(downloadLink);
          URL.revokeObjectURL(url);
        }
      };

      img.src = url;
    }
  };

  return (
    <div className='w-full'>
      <form className='space-y-6'>
        <div className='space-y-4'>
          <h3 className='text-lg text-muted-foreground'>Sharing options</h3>

          <div className='flex flex-row items-center justify-between rounded-md border p-3'>
            <div className='space-y-0.5'>
              <Label>Public link</Label>
              <p className='text-sm text-muted-foreground'>
                Anyone with this link can view your event moments
              </p>
            </div>
            <Switch
              checked={hasPublicLink}
              onCheckedChange={setHasPublicLink}
            />
          </div>

          {hasPublicLink && (
            <div className='space-y-4'>
              <div className='flex items-center space-x-2'>
                <Input value={publicUrl} readOnly className='flex-1' />
                <Button
                  variant='outline'
                  size='icon'
                  onClick={() => navigator.clipboard.writeText(publicUrl)}
                >
                  <Copy className='h-4 w-4' />
                </Button>
              </div>

              <div className='flex items-center justify-start space-x-4'>
                <div className='space-y-1.5'>
                  <Label>PIN protection</Label>
                  <Input
                    type='text'
                    placeholder='Set a 4-digit PIN'
                    value={publicPinCode}
                    onChange={(e) =>
                      setPublicPinCode(
                        e.target.value.replace(/[^0-9]/g, '').slice(0, 4)
                      )
                    }
                    maxLength={4}
                    className='w-36'
                  />
                </div>

                <div className='space-y-1.5 flex flex-col'>
                  <Label>Link expiration</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant='outline'
                        className={cn(
                          'w-[240px] justify-start text-left font-normal',
                          !publicExpiryDate && 'text-muted-foreground'
                        )}
                      >
                        {publicExpiryDate
                          ? format(publicExpiryDate, 'PPP')
                          : 'Set expiry date'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className='w-auto p-0' align='start'>
                      <Calendar
                        mode='single'
                        selected={publicExpiryDate}
                        onSelect={setPublicExpiryDate}
                        initialFocus
                        disabled={(date) => date < new Date()}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              <div className='flex flex-col space-y-4'>
                <div className='space-y-2'>
                  <Label>Shareable link</Label>
                  <p className='text-sm text-muted-foreground'>
                    Share this link with your guests to give them access to your
                    event
                  </p>
                </div>

                <div className='flex justify-start bg-emerald-50 items-center w-full gap-4'>
                  <QRCodeSVG
                    id='public-qr-code'
                    value={
                      publicUrl + (publicPinCode ? `?pin=${publicPinCode}` : '')
                    }
                    size={200}
                    level='H'
                    style={{
                      width: '100%',
                      maxWidth: '250px',
                      height: 'auto',
                      borderRadius: '8px',
                    }}
                  />
                  <div className='rounded-md bg-accent p-2 h-full'>
                    <ul>
                      <li className='text-sm list-disc text-muted-foreground text-center'>
                        Print and place this QR code at your venue for easy
                        access
                      </li>
                    </ul>
                    <Button
                      variant='outline'
                      onClick={() => downloadQRCode('public')}
                    >
                      Download QR Code
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className='flex flex-row items-center justify-between rounded-md border p-3'>
            <div className='space-y-0.5'>
              <Label>Editor link</Label>
              <p className='text-sm text-muted-foreground'>
                Anyone with this link will have editor rights on your event
              </p>
            </div>
            <Switch
              checked={hasEditorLink}
              onCheckedChange={setHasEditorLink}
            />
          </div>

          {hasEditorLink && (
            <div className='space-y-4'>
              <div className='flex items-center space-x-2'>
                <Input value={editorUrl} readOnly className='flex-1' />
                <Button
                  variant='outline'
                  size='icon'
                  onClick={() => navigator.clipboard.writeText(editorUrl)}
                >
                  <Copy className='h-4 w-4' />
                </Button>
              </div>

              <div className='space-y-2'>
                <Label>PIN protection</Label>
                <div className='flex items-center space-x-2'>
                  <Input
                    type='text'
                    placeholder='Set a 4-digit PIN'
                    value={editorPinCode}
                    onChange={(e) =>
                      setEditorPinCode(
                        e.target.value.replace(/[^0-9]/g, '').slice(0, 4)
                      )
                    }
                    maxLength={4}
                    className='w-32'
                  />
                  <span className='text-sm text-muted-foreground'>
                    Required for editor access
                  </span>
                </div>
              </div>

              <div className='space-y-2'>
                <Label>Link expiration</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant='outline'
                      className={cn(
                        'w-[240px] justify-start text-left font-normal',
                        !editorExpiryDate && 'text-muted-foreground'
                      )}
                    >
                      <CalendarIcon className='mr-2 h-4 w-4' />
                      {editorExpiryDate
                        ? format(editorExpiryDate, 'PPP')
                        : 'Set expiry date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className='w-auto p-0' align='start'>
                    <Calendar
                      mode='single'
                      selected={editorExpiryDate}
                      onSelect={setEditorExpiryDate}
                      initialFocus
                      disabled={(date) => date < new Date()}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                <div className='space-y-2'>
                  <Label>Shareable link</Label>
                  <p className='text-sm text-muted-foreground'>
                    Share this link with collaborators to give them editor
                    access
                  </p>
                </div>

                <div className='flex flex-col items-center space-y-4 w-full'>
                  <div className='w-full flex justify-center bg-white p-4 rounded-md'>
                    <QRCodeSVG
                      id='editor-qr-code'
                      value={
                        editorUrl +
                        (editorPinCode ? `?pin=${editorPinCode}` : '')
                      }
                      size={200}
                      level='H'
                      style={{
                        width: '100%',
                        maxWidth: '250px',
                        height: 'auto',
                      }}
                    />
                  </div>
                  <Button
                    variant='outline'
                    onClick={() => downloadQRCode('editor')}
                    className='flex items-center gap-2'
                  >
                    <Download className='h-4 w-4' />
                    Download QR Code
                  </Button>
                  <p className='text-sm text-muted-foreground text-center'>
                    Share this QR code with your team members for editor access
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        <Button type='submit'>Save changes</Button>
      </form>
    </div>
  );
}
