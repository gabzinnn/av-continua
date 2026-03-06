"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { LucideIcon, ChevronDown, ChevronRight } from "lucide-react"

interface NavItemProps {
  href?: string
  icon: LucideIcon
  label: string
  subItems?: { href: string; label: string }[]
}

export function NavItem({ href, icon: Icon, label, subItems }: NavItemProps) {
  const pathname = usePathname()
  const hasSubItems = subItems && subItems.length > 0

  // Verifica se o item atual (ou um de seus subitems) está ativo
  const isDirectlyActive = href ? pathname === href : false
  const isSubItemActive = subItems?.some(subItem => pathname === subItem.href)
  const isPartiallyActive = href ? pathname.startsWith(href) && href !== "/" : false

  const isActive = isDirectlyActive || isSubItemActive || (!hasSubItems && isPartiallyActive)

  const [isOpen, setIsOpen] = useState(isActive || false)

  const toggleOpen = (e: React.MouseEvent) => {
    if (hasSubItems) {
      e.preventDefault()
      setIsOpen(!isOpen)
    }
  }

  const content = (
    <>
      <div className="flex items-center gap-3">
        <Icon
          size={20}
          className={`
            ${isActive ? "text-[#111827]" : "text-[#9ca3af] group-hover:text-[#111827]"}
          `}
          strokeWidth={isActive ? 2.5 : 2}
        />
        <span className="text-sm">{label}</span>
      </div>
      {hasSubItems && (
        <div className="ml-auto text-[#9ca3af] group-hover:text-[#111827]">
          {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        </div>
      )}
    </>
  )

  const linkClasses = `
    flex items-center justify-between px-3 py-2.5 rounded-lg transition-colors group w-full cursor-pointer
    ${isActive && !hasSubItems
      ? "bg-primary/20 text-[#111827] font-semibold border-l-4 border-primary"
      : "text-[#4b5563] hover:bg-gray-50 hover:text-[#111827]"
    }
    ${hasSubItems && isActive ? "font-semibold text-[#111827]" : ""}
  `

  return (
    <div className="flex flex-col">
      {href && !hasSubItems ? (
        <Link href={href} className={linkClasses}>
          {content}
        </Link>
      ) : (
        <button onClick={toggleOpen} className={linkClasses}>
          {content}
        </button>
      )}

      {hasSubItems && isOpen && (
        <div className="flex flex-col mt-1 ml-4 pl-4 border-l border-gray-200">
          {subItems.map((subItem) => {
            const isSubActive = pathname === subItem.href
            return (
              <Link
                key={subItem.href}
                href={subItem.href}
                className={`
                  py-2 px-3 rounded-lg transition-colors text-sm
                  ${isSubActive
                    ? "text-[#111827] font-medium bg-gray-50"
                    : "text-[#6b7280] hover:text-[#111827] hover:bg-gray-50"
                  }
                `}
              >
                {subItem.label}
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}