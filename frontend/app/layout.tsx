import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { ThemeProvider as NextThemeProvider } from '@/components/theme-provider'
import { ThemeProvider } from '@/contexts/theme-context'
import { UserProvider } from '@/hooks/use-user'
import { AuthProvider } from '@/lib/auth-context'
import { NotificationProvider } from '@/components/notification-provider'
import { Toaster } from '@/components/ui/toaster'
import { SupabaseProvider } from '@/lib/supabase-context'
import { SpotifyProvider } from '@/contexts/spotify-context'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Habit Tracker Pro',
  description: 'Track your habits and boost your productivity',
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/icon.png', type: 'image/png', sizes: '32x32' },
    ],
    apple: { url: '/apple-icon.png', type: 'image/png', sizes: '180x180' },
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} antialiased min-h-screen`}>
        <NextThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
        >
          <ThemeProvider>
            <AuthProvider>
              <SupabaseProvider>
                <SpotifyProvider>
                  <UserProvider>
                    <NotificationProvider>
                      <div className="flex min-h-screen flex-col">
                        {children}
                      </div>
                      <Toaster />
                    </NotificationProvider>
                  </UserProvider>
                </SpotifyProvider>
              </SupabaseProvider>
            </AuthProvider>
          </ThemeProvider>
        </NextThemeProvider>
      </body>
    </html>
  )
}