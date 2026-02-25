import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: 'MiniMe - Intelligence From Action',
  description: 'Transform your daily work into actionable insights with MiniMe — your personal activity intelligence platform.',
  icons: {
    icon: '/icon.png',
    apple: '/apple-touch-icon.png',
  },
  openGraph: {
    title: 'MiniMe - Intelligence From Action',
    description: 'Transform your daily work into actionable insights with MiniMe.',
    images: [{ url: '/logo.png', width: 1024, height: 1024 }],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
