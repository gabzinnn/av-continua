import { Sidebar } from "@/src/app/components/NavBar/Sidebar"

export default function MembrosLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex h-screen w-full overflow-hidden">
      <Sidebar />
      <main className="flex-1 flex flex-col h-full overflow-hidden bg-bg-main pt-16 md:pt-0">
        {children}
      </main>
    </div>
  )
}