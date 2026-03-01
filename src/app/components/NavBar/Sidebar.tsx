"use client"

import { useState, useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useMember } from "@/src/context/memberContext"
import { NavItem } from "./NavItem"
import { UserCard } from "./UserCard"
import { Home, FileEdit, History, Archive, LogOut, Menu, X, LucideIcon, Thermometer, ClipboardList, Activity } from "lucide-react"
import { temPCOAtiva } from "@/src/actions/pcoActions"

interface NavRoute {
  href: string
  icon: LucideIcon
  label: string
}

const baseRoutes: NavRoute[] = [
  { href: "/home", icon: Home, label: "Home" },
  { href: "/avatual", icon: FileEdit, label: "Avaliação atual" },
  { href: "/termometro", icon: Thermometer, label: "Termômetro" },
  { href: "/historico-termometro", icon: Activity, label: "Histórico Termômetro" },
  { href: "/historico", icon: History, label: "Histórico" },
  { href: "/avaliacoes", icon: Archive, label: "Avaliações recebidas" },
]

const pcoRoute: NavRoute = { href: "/pco", icon: ClipboardList, label: "Pesquisa de Clima" }

export function Sidebar() {
  const [isOpen, setIsOpen] = useState(false)
  const [showPCO, setShowPCO] = useState(false)
  const { selectedMember, clearMember } = useMember()
  const router = useRouter()
  const pathname = usePathname()

  // Check if there's an active PCO for this member
  useEffect(() => {
    if (!selectedMember) return
    temPCOAtiva(Number(selectedMember.id))
      .then(setShowPCO)
      .catch(() => setShowPCO(false))
  }, [selectedMember, pathname])

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
    clearMember()
    router.push("/")
  }

  if (!selectedMember) return null

  // Build nav routes dynamically
  const navRoutes = showPCO
    ? [...baseRoutes.slice(0, 3), pcoRoute, ...baseRoutes.slice(3)]
    : baseRoutes

  return (
    <>
      {/* Mobile Header */}
      <header className="md:hidden fixed top-0 left-0 right-0 h-16 bg-white border-b border-[#e5e7eb] flex items-center justify-between px-4 z-40 shadow-sm">
        <UserCard
          nome={selectedMember.nome}
          area={selectedMember.area}
          foto={selectedMember.foto}
          compact
        />

        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 rounded-lg hover:bg-gray-50 transition-colors"
          aria-label={isOpen ? "Fechar menu" : "Abrir menu"}
        >
          {isOpen ? (
            <X size={28} className="text-[#374151]" />
          ) : (
            <Menu size={28} className="text-[#374151]" />
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
          w-64 bg-white border-r border-[#e5e7eb] shadow-sm
          transition-transform duration-300 ease-in-out
          ${isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
        `}
      >
        {/* Header - User Info */}
        <div className="p-6 border-b border-[#f3f4f6]">
          <div className="flex items-center justify-between">
            <UserCard
              nome={selectedMember.nome}
              area={selectedMember.area}
              foto={selectedMember.foto}
            />

            {/* Botão fechar - apenas mobile */}
            <button
              onClick={() => setIsOpen(false)}
              className="md:hidden p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <X size={20} className="text-[#6b7280]" />
            </button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 flex flex-col gap-1 p-4 overflow-y-auto">
          {navRoutes.map((route) => (
            <NavItem
              key={route.href}
              href={route.href}
              icon={route.icon}
              label={route.label}
            />
          ))}
        </nav>

        {/* Footer - Logout */}
        <div className="p-4 border-t border-[#f3f4f6]">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg 
              text-[#ef4444] hover:bg-red-50 transition-colors cursor-pointer"
          >
            <LogOut size={20} />
            <span className="text-sm font-medium">Sair do Sistema</span>
          </button>
        </div>
      </aside>
    </>
  )
}