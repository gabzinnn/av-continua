"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Button } from "@/src/app/components/Button"
import { Card } from "@/src/app/components/Card"
import { loginCoordenador } from "@/src/actions/authActions"
import { useAuth } from "@/src/context/authContext"
import { User, IdCard, Lock, KeyRound, AlertCircle, LogIn } from "lucide-react"

export default function LoginPage() {
    const [usuario, setUsuario] = useState("")
    const [senha, setSenha] = useState("")
    const [error, setError] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const router = useRouter()
    const { login, isAuthenticated } = useAuth()

    useEffect(() => {
        if (isAuthenticated) {
            router.push("/coord/home")
        }
    }, [isAuthenticated])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError("")
        setIsLoading(true)

        const result = await loginCoordenador(usuario, senha)

        if (result.success && result.coordenador) {
            login(result.coordenador)
            router.push("/coord/home")
        } else {
            setError(result.error || "Erro ao fazer login")
        }

        setIsLoading(false)
    }

    return (
        <div className="bg-bg-main min-h-screen flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-[500px] flex flex-col items-center gap-8 relative z-10">
                {/* Logo */}
                <div className="flex flex-col items-center gap-4">
                    <Image
                        src="/assets/images/logoCompletaFundoBranco.png"
                        alt="Logo do Clube"
                        width={200}
                        height={48}
                        className="h-auto"
                    />
                    <div className="text-center space-y-2 mt-2">
                        <h1 className="text-text-main text-2xl font-bold tracking-tight">
                            Sistema de Coordenação
                        </h1>
                        <p className="text-text-muted text-lg font-medium">
                            Informe suas credenciais para entrar
                        </p>
                    </div>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="w-full flex flex-col gap-6">
                    <Card className="space-y-5">
                        {/* Usuário */}
                        <div>
                            <label
                                htmlFor="username"
                                className="text-text-main text-sm font-semibold mb-2 flex items-center gap-2 uppercase tracking-wider"
                            >
                                <User size={18} className="text-primary" />
                                Usuário
                            </label>
                            <div className="relative group">
                                <input
                                    type="text"
                                    id="username"
                                    value={usuario}
                                    onChange={(e) => setUsuario(e.target.value)}
                                    placeholder="Seu usuário de acesso"
                                    className="w-full rounded-xl border border-gray-200 bg-bg-main px-4 py-4 pl-12 text-text-main placeholder-text-muted/70 text-lg font-medium focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none transition-all"
                                />
                                <IdCard 
                                    size={22} 
                                    className="pointer-events-none absolute top-1/2 -translate-y-1/2 left-4 text-text-muted group-focus-within:text-primary transition-colors" 
                                />
                            </div>
                        </div>

                        {/* Senha */}
                        <div>
                            <label
                                htmlFor="password"
                                className="text-text-main text-sm font-semibold mb-2 flex items-center gap-2 uppercase tracking-wider"
                            >
                                <Lock size={18} className="text-primary" />
                                Senha
                            </label>
                            <div className="relative group">
                                <input
                                    type="password"
                                    id="password"
                                    value={senha}
                                    onChange={(e) => setSenha(e.target.value)}
                                    placeholder="••••••••"
                                    className="w-full rounded-xl border border-gray-200 bg-bg-main px-4 py-4 pl-12 text-text-main placeholder-text-muted/70 text-lg font-medium focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none transition-all"
                                />
                                <KeyRound 
                                    size={22} 
                                    className="pointer-events-none absolute top-1/2 -translate-y-1/2 left-4 text-text-muted group-focus-within:text-primary transition-colors" 
                                />
                            </div>
                        </div>

                        {/* Error message */}
                        {error && (
                            <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 p-3 rounded-lg">
                                <AlertCircle size={18} />
                                <span>{error}</span>
                            </div>
                        )}
                    </Card>

                    {/* Submit button */}
                    <Button
                        type="submit"
                        size="lg"
                        className="w-full h-16 text-lg"
                        disabled={isLoading}
                        isLoading={isLoading}
                        icon={<LogIn size={22} />}
                    >
                        Entrar
                    </Button>
                </form>
            </div>
        </div>
    )
}
