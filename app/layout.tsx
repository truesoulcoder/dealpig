import './globals.css'
import './heroui.css'
import { Inter } from 'next/font/google'
import { Providers } from './providers'

// Try to initialize storage buckets but don't crash the app if it fails
try {
  const { ensureStorageBuckets } = require('@/lib/supabaseAdmin');
  ensureStorageBuckets().catch((error: any) => {
    console.error('Failed to initialize storage buckets:', error);
  });
} catch (error) {
  console.error('Error importing storage module:', error);
}

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'Dealpig',
  description: 'Dealpig is a shotgun approach to lowballing boomers on Zillow',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head></head>
      <body className={inter.className}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}
