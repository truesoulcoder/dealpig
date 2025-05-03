import '../styles/globals.css'
import '../styles/heroui.css'
import '../styles/leet.css'
import '../styles/dealpig-animation.css';
import '../styles/dealpigtext-animation.css';
import { Inter } from 'next/font/google'
import { Providers } from './providers'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'Dealpig',
  description: 'A blind pig might find a nut but DealPig shakes the tree',
}

import NavbarWithAvatar from '../components/navbar-with-avatar';

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
          <NavbarWithAvatar />
          <main>
            {children}
          </main>
        </Providers>
      </body>
    </html>
  )
}
