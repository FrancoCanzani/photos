import { ThemeSwitcher } from '@/components/theme-switcher';
import { Geist } from 'next/font/google';
import { ThemeProvider } from 'next-themes';
import { Toaster } from 'sonner';
import './globals.css';

const defaultUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : 'http://localhost:3000';

export const metadata = {
  metadataBase: new URL(defaultUrl),
  title: 'Next.js and Supabase Starter Kit',
  description: 'The fastest way to build apps with Next.js and Supabase',
};

const geistSans = Geist({
  display: 'swap',
  subsets: ['latin'],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang='en' className={geistSans.className} suppressHydrationWarning>
      <body className='bg-background text-foreground'>
        <ThemeProvider
          attribute='class'
          defaultTheme='system'
          enableSystem
          disableTransitionOnChange
        >
          <main
            className='min-h-screen max-w-5xl mx-auto flex flex-col justify-between items-stretch
          '
          >
            <div className='flex-1'>{children}</div>
            <footer className='w-full flex items-center justify-center border-t mx-auto text-center text-xs'>
              <ThemeSwitcher />
            </footer>
          </main>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
