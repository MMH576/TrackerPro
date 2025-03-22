import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { ThemeProvider } from '@/components/theme-provider'
import { Toaster } from '@/components/ui/toaster'
import { AuthProvider } from '@/lib/auth-context'
import { UserProvider } from '@/hooks/use-user'
import { CustomHeader } from '@/components/custom-header'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'HabitHero - Build Better Habits',
  description: 'Track and build better habits with HabitHero',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
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
              <div className="min-h-screen flex flex-col">
                <CustomHeader />
                <main className="flex-1 overflow-hidden">
                  {children}
                </main>
              </div>
              <Toaster />
            </UserProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}