"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

interface NavItemProps {
  href: string
  icon: string
  label: string
}

export function NavItem({ href, icon, label }: NavItemProps) {
  const pathname = usePathname()
  const isActive = pathname === href

  return (
    <Link
      href={href}
      className={`
        flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors group
        ${isActive 
          ? "bg-primary/20 text-[#111827] font-semibold border-l-4 border-primary" 
          : "text-[#4b5563] hover:bg-gray-50 hover:text-[#111827]"
        }
      `}
    >
      <span 
        className={`
          material-symbols-outlined text-[20px]
          ${isActive ? "text-[#111827] icon-filled" : "text-[#9ca3af] group-hover:text-[#111827]"}
        `}
      >
        {icon}
      </span>
      <span className="text-sm">{label}</span>
    </Link>
  )
}