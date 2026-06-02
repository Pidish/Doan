import { Sidebar } from '../../src/components/Sidebar'
import { MobileHeader } from '../../src/components/MobileHeader'
import { BottomNav } from '../../src/components/BottomNav'

export default function MainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div suppressHydrationWarning className="flex max-w-[1600px] mx-auto min-h-screen relative">
      <Sidebar />
      <MobileHeader />
      <main className="md:ml-72 flex-1 pt-16 md:pt-0 pb-24 md:pb-0">
        {children}
      </main>
      <BottomNav />
    </div>
  )
}
