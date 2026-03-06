import Image from "next/image"
import Link from "next/link"
import { SimuladoSessionProvider } from "./context"

export default function ExternoLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <SimuladoSessionProvider>
            <div className="min-h-screen bg-[#Fcfbf8] flex flex-col font-sans">
                {/* Topbar Clean */}
                <header className="bg-white border-b border-border h-16 flex items-center justify-between px-6 shrink-0 shadow-sm z-50">
                    <Link href="/simulado" className="flex items-center gap-3">
                        <Image src="/assets/images/logoCompletaFundoBranco.png" alt="Logo" width={120} height={60} />
                    </Link>
                </header>

                {/* Main Content Area */}
                <main className="flex-1 flex flex-col items-center">
                    {children}
                </main>

                {/* Footer Clean */}
                <footer className="py-6 text-center text-xs text-gray-400 font-medium shrink-0">
                    <p>© {new Date().getFullYear()} UFRJ Consulting Club. Todos os direitos reservados.</p>
                </footer>
            </div>
        </SimuladoSessionProvider>
    )
}
