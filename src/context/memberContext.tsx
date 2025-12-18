"use client"

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react"

interface SelectedMember {
  id: string
  nome: string
  area: string
  foto: string | null
}

interface MemberContextType {
  selectedMember: SelectedMember | null
  isLoading: boolean
  selectMember: (member: SelectedMember) => void
  clearMember: () => void
}

const MemberContext = createContext<MemberContextType | null>(null)

const STORAGE_KEY = "@AVContinua:selected_member"

interface MemberProviderProps {
  children: ReactNode
}

export function MemberProvider({ children }: MemberProviderProps) {
  const [selectedMember, setSelectedMember] = useState<SelectedMember | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Carrega o membro do localStorage ao iniciar
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      try {
        setSelectedMember(JSON.parse(stored))
      } catch {
        localStorage.removeItem(STORAGE_KEY)
      }
    }
    setIsLoading(false)
  }, [])

  const selectMember = useCallback((member: SelectedMember) => {
    setSelectedMember(member)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(member))
  }, [])

  const clearMember = useCallback(() => {
    setSelectedMember(null)
    localStorage.removeItem(STORAGE_KEY)
  }, [])

  return (
    <MemberContext.Provider
      value={{
        selectedMember,
        isLoading,
        selectMember,
        clearMember,
      }}
    >
      {children}
    </MemberContext.Provider>
  )
}

export function useMember() {
  const context = useContext(MemberContext)
  if (!context) {
    throw new Error("useMember deve ser usado dentro de um MemberProvider")
  }
  return context
}