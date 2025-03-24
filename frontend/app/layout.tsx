import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { ThemeProvider } from '@/components/theme-provider'
import { UserProvider } from '@/hooks/use-user'
import { AuthProvider } from '@/lib/auth-context'
import { NotificationProvider } from '@/components/notification-provider'
import { Toaster } from '@/components/ui/toaster'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'TrackerPro - Track Your Habits',
  description: 'Track your habits, compete with friends, and stay motivated',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
        >
          <AuthProvider>
            <UserProvider>
              <NotificationProvider>
                {children}
              </NotificationProvider>
            </UserProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}