"use client"

import { useState, useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useAuth } from "@/src/context/authContext"
import Image from "next/image"
import Link from "next/link"
import { 
    Home, 
    PieChart, 
    ClipboardList, 
    History, 
    Users, 
    CheckSquare, 
    LogOut, 
    Menu, 
    X,
    LucideIcon 
} from "lucide-react"

interface NavRoute {
    href: string
    icon: LucideIcon
    label: string
}

const navRoutes: NavRoute[] = [
    { href: "/coord/home", icon: Home, label: "Home" },
    { href: "/coord/alocacao", icon: PieChart, label: "Overview de Alocação" },
    { href: "/coord/avaliacoes", icon: ClipboardList, label: "Controle de Avaliações" },
    { href: "/coord/historico", icon: History, label: "Histórico de Avaliações" },
    { href: "/coord/membros", icon: Users, label: "Membros" },
    { href: "/coord/demandas", icon: CheckSquare, label: "Demandas" },
]

export function CoordsSidebar() {
    const [isOpen, setIsOpen] = useState(false)
    const { logout } = useAuth()
    const router = useRouter()
    const pathname = usePathname()

    // Fecha o menu ao mudar de rota
    useEffect(() => {
        setIsOpen(false)
    }, [pathname])

    // Fecha o menu ao redimensionar para desktop
    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth >= 768) {
                setIsOpen(false)
            }
        }

        window.addEventListener("resize", handleResize)
        return () => window.removeEventListener("resize", handleResize)
    }, [])

    // Bloqueia scroll do body quando menu está aberto
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = "hidden"
        } else {
            document.body.style.overflow = "unset"
        }

        return () => {
            document.body.style.overflow = "unset"
        }
    }, [isOpen])

    const handleLogout = () => {
        logout()
        router.push("/coord")
    }

    const isActive = (href: string) => pathname === href

    return (
        <>
            {/* Mobile Header */}
            <header className="md:hidden fixed top-0 left-0 right-0 h-16 bg-white border-b border-border flex items-center justify-between px-4 z-40 shadow-sm">
                <div className="flex items-center gap-3">
                    <Image
                        src="/assets/images/logoCompletaFundoBranco.png"
                        alt="Logo"
                        width={120}
                        height={30}
                        className="h-auto"
                    />
                </div>

                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="p-2 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                    aria-label={isOpen ? "Fechar menu" : "Abrir menu"}
                >
                    {isOpen ? (
                        <X size={28} className="text-text-main" />
                    ) : (
                        <Menu size={28} className="text-text-main" />
                    )}
                </button>
            </header>

            {/* Overlay */}
            {isOpen && (
                <div
                    className="md:hidden fixed inset-0 bg-black/50 z-40 backdrop-blur-sm"
                    onClick={() => setIsOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside
                className={`
                    fixed md:static top-0 left-0 h-screen flex flex-col z-50
                    w-[280px] bg-[#fcfbf8] border-r border-border
                    transition-transform duration-300 ease-in-out
                    ${isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
                `}
            >
                <div className="p-6 flex flex-col h-full justify-between">
                    <div className="flex flex-col gap-6">
                        {/* Logo Header */}
                        <div className="flex items-center gap-3">
                            <Image
                                src="/assets/images/logoCompletaFundoBranco.png"
                                alt="Logo"
                                width={140}
                                height={35}
                                className="h-auto"
                            />
                        </div>

                        {/* Navigation */}
                        <nav className="flex flex-col gap-2">
                            {navRoutes.map((route) => {
                                const Icon = route.icon
                                const active = isActive(route.href)
                                
                                return (
                                    <Link
                                        key={route.href}
                                        href={route.href}
                                        className={`
                                            flex items-center gap-3 px-4 py-3 rounded-lg transition-all
                                            ${active 
                                                ? "bg-primary/20 border-l-4 border-primary shadow-sm" 
                                                : "hover:bg-[#f4f2e6] border-l-4 border-transparent"
                                            }
                                        `}
                                    >
                                        <Icon 
                                            size={20} 
                                            className={active ? "text-text-main" : "text-gray-500"} 
                                        />
                                        <span 
                                            className={`text-sm leading-normal ${
                                                active 
                                                    ? "font-bold text-text-main" 
                                                    : "font-medium text-gray-500"
                                            }`}
                                        >
                                            {route.label}
                                        </span>
                                    </Link>
                                )
                            })}
                        </nav>
                    </div>

                    {/* Footer - Logout */}
                    <div className="mt-auto pt-6 border-t border-border">
                        <button
                            onClick={handleLogout}
                            className="flex items-center gap-3 px-4 py-2 w-full text-left rounded-lg 
                                hover:bg-[#f4f2e6] text-gray-500 hover:text-text-main transition-colors cursor-pointer"
                        >
                            <LogOut size={20} />
                            <span className="text-sm font-medium">Sair</span>
                        </button>
                    </div>
                </div>
            </aside>
        </>
    )
}
