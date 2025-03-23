import { Toaster } from "@/components/ui/toaster"

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1 overflow-hidden">
        {children}
      </main>
      <Toaster />
    </div>
  )
} 