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
                        <div className="bg-[#FAD419] p-1.5 rounded-lg flex items-center justify-center">
                            <span className="material-symbols-outlined text-text-main text-xl">school</span>
                        </div>
                        <span className="font-black text-text-main text-lg tracking-tight">UFRJ Consulting Club</span>
                    </Link>
                    <div className="flex items-center gap-6">
                        <nav className="hidden md:flex items-center gap-6 text-sm font-bold text-gray-500">
                            <span className="text-text-main">Simulados</span>
                            <span className="hover:text-text-main transition-colors cursor-pointer">Recursos</span>
                            <span className="hover:text-text-main transition-colors cursor-pointer">Sobre</span>
                        </nav>
                    </div>
                </header>

                {/* Main Content Area */}
                <main className="flex-1 flex flex-col items-center">
                    {children}
                </main>

                {/* Footer Clean */}
                <footer className="py-6 text-center text-xs text-gray-400 font-medium shrink-0">
                    <div className="flex justify-center gap-4 mb-2">
                        <span className="hover:text-gray-600 cursor-pointer">Política de Privacidade</span>
                        <span className="hover:text-gray-600 cursor-pointer">Termos de Uso</span>
                        <span className="hover:text-gray-600 cursor-pointer">Ajuda</span>
                    </div>
                    <p>© {new Date().getFullYear()} UFRJ Consulting Club. Todos os direitos reservados.</p>
                </footer>
            </div>
        </SimuladoSessionProvider>
    )
}
