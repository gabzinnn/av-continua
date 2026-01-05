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
    Users, 
    CheckSquare, 
    LogOut, 
    Menu, 
    X,
    LucideIcon, 
    CircleDollarSign,
    FileText,
    ChevronDown,
    ClipboardCheck
} from "lucide-react"

interface NavRoute {
    href: string
    icon: LucideIcon
    label: string
}

interface NavGroup {
    icon: LucideIcon
    label: string
    children: NavRoute[]
}

const navRoutes: NavRoute[] = [
    { href: "/coord/home", icon: Home, label: "Home" },
    { href: "/coord/alocacao", icon: PieChart, label: "Overview de Alocação" },
    { href: "/coord/avaliacoes", icon: ClipboardList, label: "Controle de Avaliações" },
    { href: "/coord/pagamentos", icon: CircleDollarSign, label: "Controle de Gastos" },
    { href: "/coord/membros", icon: Users, label: "Membros" },
    { href: "/coord/demandas", icon: CheckSquare, label: "Demandas" },
]

const navGroups: NavGroup[] = [
    {
        icon: FileText,
        label: "Processo Seletivo",
        children: [
            { href: "/coord/processo-seletivo/provas", icon: ClipboardCheck, label: "Provas" },
        ]
    }
]

export function CoordsSidebar() {
    const [isOpen, setIsOpen] = useState(false)
    const [expandedGroups, setExpandedGroups] = useState<string[]>([])
    const { logout } = useAuth()
    const router = useRouter()
    const pathname = usePathname()

    // Fecha o menu ao mudar de rota
    useEffect(() => {
        setIsOpen(false)
    }, [pathname])

    // Auto-expand group if current path matches
    useEffect(() => {
        navGroups.forEach(group => {
            const isChildActive = group.children.some(child => pathname.startsWith(child.href))
            if (isChildActive && !expandedGroups.includes(group.label)) {
                setExpandedGroups(prev => [...prev, group.label])
            }
        })
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

    const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/")

    const toggleGroup = (label: string) => {
        setExpandedGroups(prev => 
            prev.includes(label) 
                ? prev.filter(g => g !== label)
                : [...prev, label]
        )
    }

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

                            {/* Collapsible Groups */}
                            {navGroups.map((group) => {
                                const GroupIcon = group.icon
                                const isExpanded = expandedGroups.includes(group.label)
                                const hasActiveChild = group.children.some(child => isActive(child.href))
                                
                                return (
                                    <div key={group.label}>
                                        <button
                                            onClick={() => toggleGroup(group.label)}
                                            className={`
                                                w-full flex items-center justify-between gap-3 px-4 py-3 rounded-lg transition-all cursor-pointer
                                                ${hasActiveChild 
                                                    ? "bg-primary/10 border-l-4 border-primary" 
                                                    : "hover:bg-[#f4f2e6] border-l-4 border-transparent"
                                                }
                                            `}
                                        >
                                            <div className="flex items-center gap-3">
                                                <GroupIcon 
                                                    size={20} 
                                                    className={hasActiveChild ? "text-text-main" : "text-gray-500"} 
                                                />
                                                <span 
                                                    className={`text-sm leading-normal ${
                                                        hasActiveChild 
                                                            ? "font-bold text-text-main" 
                                                            : "font-medium text-gray-500"
                                                    }`}
                                                >
                                                    {group.label}
                                                </span>
                                            </div>
                                            <ChevronDown 
                                                size={16} 
                                                className={`text-gray-400 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                                            />
                                        </button>
                                        
                                        {/* Submenu */}
                                        <div className={`overflow-hidden transition-all duration-200 ${isExpanded ? "max-h-40" : "max-h-0"}`}>
                                            <div className="pl-4 mt-1 flex flex-col gap-1">
                                                {group.children.map((child) => {
                                                    const ChildIcon = child.icon
                                                    const childActive = isActive(child.href)
                                                    
                                                    return (
                                                        <Link
                                                            key={child.href}
                                                            href={child.href}
                                                            className={`
                                                                flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all
                                                                ${childActive 
                                                                    ? "bg-primary/20 text-text-main font-semibold" 
                                                                    : "hover:bg-[#f4f2e6] text-gray-500"
                                                                }
                                                            `}
                                                        >
                                                            <ChildIcon size={18} />
                                                            <span className="text-sm">{child.label}</span>
                                                        </Link>
                                                    )
                                                })}
                                            </div>
                                        </div>
                                    </div>
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

