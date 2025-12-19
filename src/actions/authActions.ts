"use server"

import prisma from "@/src/lib/prisma"
import bcrypt from "bcrypt"

export interface LoginResult {
    success: boolean
    error?: string
    coordenador?: {
        id: number
        nome: string
        usuario: string
    }
}

export async function loginCoordenador(
    usuario: string,
    senha: string
): Promise<LoginResult> {
    try {
        if (!usuario || !senha) {
            return { success: false, error: "Preencha todos os campos" }
        }

        const coordenador = await prisma.coordenador.findUnique({
            where: { usuario },
            select: {
                id: true,
                nome: true,
                usuario: true,
                senhaHash: true,
            },
        })

        if (!coordenador) {
            return { success: false, error: "Usuário ou senha inválidos" }
        }

        const senhaValida = await bcrypt.compare(senha, coordenador.senhaHash)

        if (!senhaValida) {
            return { success: false, error: "Usuário ou senha inválidos" }
        }

        return {
            success: true,
            coordenador: {
                id: coordenador.id,
                nome: coordenador.nome,
                usuario: coordenador.usuario,
            },
        }
    } catch (error) {
        console.error("Erro no login:", error)
        return { success: false, error: "Erro interno do servidor" }
    }
}

// Função auxiliar para criar hash de senha (usar para criar coordenadores)
export async function hashSenha(senha: string): Promise<string> {
    const saltRounds = 10
    return bcrypt.hash(senha, saltRounds)
}
