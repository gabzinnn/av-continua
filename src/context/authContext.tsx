"use client"

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react"
import { useRouter } from "next/navigation"

interface Coordenador {
    id: number
    nome: string
    usuario: string
}

interface AuthContextType {
    coordenador: Coordenador | null
    isLoading: boolean
    isAuthenticated: boolean
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
        router.push("/coord/login")
    }, [router])

    return (
        <AuthContext.Provider
            value={{
                coordenador,
                isLoading,
                isAuthenticated: !!coordenador,
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
