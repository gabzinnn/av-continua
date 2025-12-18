import { ReactNode } from "react"

interface CardProps {
  children: ReactNode
  className?: string
}

export function Card({ children, className = "" }: CardProps) {
  return (
    <div
      className={`
        bg-bg-card border border-border rounded-2xl p-6
        shadow-[0_8px_30px_rgba(0,0,0,0.04)]
        hover:shadow-[0_8px_30px_rgba(250,212,25,0.08)]
        transition-all duration-300
        ${className}
      `}
    >
      {children}
    </div>
  )
}