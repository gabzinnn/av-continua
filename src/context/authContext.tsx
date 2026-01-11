"use client"

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react"
import { useRouter } from "next/navigation"
import type { UserRole } from "@/src/actions/authActions"

interface Coordenador {
    id: number
    nome: string
    usuario: string
    role: UserRole
}

interface AuthContextType {
    coordenador: Coordenador | null
    isLoading: boolean
    isAuthenticated: boolean
    isEquipePS: boolean
    isCoordenador: boolean
    login: (coordenador: Coordenador) => void
    logout: () => void
}

const AuthContext = createContext<AuthContextType | null>(null)

const STORAGE_KEY = "@AVContinua:coordenador"

interface AuthProviderProps {
    children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
    const [coordenador, setCoordenador] = useState<Coordenador | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const router = useRouter()

    // Carrega o coordenador do localStorage ao iniciar
    useEffect(() => {
        const stored = localStorage.getItem(STORAGE_KEY)
        if (stored) {
            try {
                setCoordenador(JSON.parse(stored))
            } catch {
                localStorage.removeItem(STORAGE_KEY)
            }
        }
        setIsLoading(false)
    }, [])

    const login = useCallback((coord: Coordenador) => {
        setCoordenador(coord)
        localStorage.setItem(STORAGE_KEY, JSON.stringify(coord))
    }, [])

    const logout = useCallback(() => {
        setCoordenador(null)
        localStorage.removeItem(STORAGE_KEY)
        router.push("/coord")
    }, [router])

    const isEquipePS = coordenador?.role === "equipeps"
    const isCoordenador = coordenador?.role === "coordenador"

    return (
        <AuthContext.Provider
            value={{
                coordenador,
                isLoading,
                isAuthenticated: !!coordenador,
                isEquipePS,
                isCoordenador,
                login,
                logout,
            }}
        >
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth() {
    const context = useContext(AuthContext)
    if (!context) {
        throw new Error("useAuth deve ser usado dentro de um AuthProvider")
    }
    return context
}

