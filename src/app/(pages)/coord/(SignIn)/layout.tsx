import { ProtectedRoute } from "@/src/app/components/ProtectedRoute"
import { CoordsSidebar } from "@/src/app/components/coords/CoordsSidebar"

export default function CoordsHomeLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <ProtectedRoute>
            <div className="flex h-screen w-full overflow-hidden bg-bg-main">
                <CoordsSidebar />
                <main className="flex-1 flex flex-col h-full overflow-hidden pt-16 md:pt-0">
                    {children}
                </main>
            </div>
        </ProtectedRoute>
    )
}
