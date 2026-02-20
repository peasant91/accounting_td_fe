'use client';

import './globals.css';
import { QueryProvider } from '@/lib/providers';
import { Layout } from '@/components/Layout';
import { Toaster } from '@/components/ui/sonner';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <QueryProvider>
          <Layout>{children}</Layout>
          <Toaster />
        </QueryProvider>
      </body>
    </html>
  );
}
