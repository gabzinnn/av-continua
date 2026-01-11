"use client"

import { useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useAuth } from "@/src/context/authContext"

interface ProtectedRouteProps {
    children: React.ReactNode
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
    const { isAuthenticated, isLoading, isEquipePS } = useAuth()
    const router = useRouter()
    const pathname = usePathname()

    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            router.push("/coord")
        }
    }, [isAuthenticated, isLoading, router])

    // Proteção para equipeps - só pode acessar rotas do processo seletivo
    useEffect(() => {
        if (!isLoading && isAuthenticated && isEquipePS) {
            const allowedPaths = ["/coord/processo-seletivo"]
            const isAllowed = allowedPaths.some(path => pathname.startsWith(path))

            if (!isAllowed) {
                router.push("/coord/processo-seletivo/provas")
            }
        }
    }, [isLoading, isAuthenticated, isEquipePS, pathname, router])

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-bg-main">
                <div className="text-text-muted">Carregando...</div>
            </div>
        )
    }

    if (!isAuthenticated) {
        return null
    }

    // Bloqueia renderização para equipeps em rotas não permitidas
    if (isEquipePS && !pathname.startsWith("/coord/processo-seletivo")) {
        return null
    }

    return <>{children}</>
}

