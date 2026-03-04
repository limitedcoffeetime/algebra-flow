import type { Metadata } from 'next';
import { AppShell } from '@/components/AppShell';
import { Providers } from '@/components/Providers';
import './globals.css';

export const metadata: Metadata = {
  title: 'Algebra Flow Web',
  description: 'Practice algebra in your browser with focused mixed-review sessions.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <AppShell>{children}</AppShell>
        </Providers>
      </body>
    </html>
  );
}
