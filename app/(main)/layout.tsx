import { Sidebar } from '../../src/components/Sidebar'

export default function MainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div suppressHydrationWarning className="flex max-w-[1600px] mx-auto min-h-screen relative">
      <Sidebar />
      <main className="md:ml-72 flex-1">
        {children}
      </main>
    </div>
  )
}