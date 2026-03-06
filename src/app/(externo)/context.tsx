"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { Questao } from "@/src/app/(pages)/(membros)/programa-preparacao/simulados/context";

// Definition of an answered question during the simulation
export interface RespostaUsuario {
    questaoId: number;
    alternativaId?: string; // id da alternativa escolhida (A, B, etc.)
    respostaDiscursiva?: string;
}

export interface SimuladoSession {
    id: string; // ID único da sessão (geralmente gerado no frontend)
    nomeUsuario: string;
    emailUsuario: string;
    tipoSimulado: string;
    dificuldade?: string;
    questoes: Questao[];
    respostas: RespostaUsuario[];
    tempoTotalSegundos: number; // Ex: 1200 (20 min)
    tempoRestanteSegundos: number; // Salvar progresso
    dataCriacao: string;
    status: "CONFIGURANDO" | "EM_ANDAMENTO" | "FINALIZADO" | "PROCESSANDO";
}

interface SimuladoSessionContextType {
    session: SimuladoSession | null;
    iniciarSessao: (
        nome: string,
        email: string,
        tipo: string,
        dificuldade: string | undefined,
        qtdQuestoes: number,
        bancoDisponivel: Questao[]
    ) => string | null;
    responderQuestao: (questaoId: number, resposta: Partial<RespostaUsuario>) => void;
    atualizarTempo: (segundosRestantes: number) => void;
    finalizarSimulado: () => void;
    limparSessao: () => void;
}

const SimuladoSessionContext = createContext<SimuladoSessionContextType | null>(null);

const STORAGE_KEY = "@AVContinua:simulado_session";

export function SimuladoSessionProvider({ children }: { children: ReactNode }) {
    const [session, setSession] = useState<SimuladoSession | null>(null);
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            try {
                setSession(JSON.parse(stored));
            } catch (e) {
                console.error("Erro ao carregar sessão do simulado:", e);
                localStorage.removeItem(STORAGE_KEY);
            }
        }
        setIsLoaded(true);
    }, []);

    // Salva automaticamente no localstorage ao mudar
    useEffect(() => {
        if (!isLoaded) return;

        if (session) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
        } else {
            localStorage.removeItem(STORAGE_KEY);
        }
    }, [session, isLoaded]);

    const iniciarSessao = (
        nome: string,
        email: string,
        tipo: string,
        dificuldade: string | undefined,
        qtdQuestoes: number,
        bancoDisponivel: Questao[]
    ) => {
        // Filtrar o banco de acordo com as preferências
        let questoesFiltradas = [...bancoDisponivel];

        if (tipo !== "Geral") {
            questoesFiltradas = questoesFiltradas.filter(q => q.banco === tipo);
        }

        if (dificuldade) {
            questoesFiltradas = questoesFiltradas.filter(q => q.dificuldade === dificuldade);
        }

        // Shuffle e pegar X aleatórias
        const shuffled = questoesFiltradas.sort(() => 0.5 - Math.random());
        const questoesSelecionadas = shuffled.slice(0, qtdQuestoes);

        if (questoesSelecionadas.length === 0) {
            return null; // Não há questões suficientes para criar a prova
        }

        const novaSessao: SimuladoSession = {
            id: crypto.randomUUID(),
            nomeUsuario: nome,
            emailUsuario: email,
            tipoSimulado: tipo,
            dificuldade,
            questoes: questoesSelecionadas,
            respostas: [],
            tempoTotalSegundos: questoesSelecionadas.length * 120, // 2 min (120s) por questão
            tempoRestanteSegundos: questoesSelecionadas.length * 120,
            dataCriacao: new Date().toISOString(),
            status: "EM_ANDAMENTO"
        };

        setSession(novaSessao);
        return novaSessao.id;
    };

    const responderQuestao = (questaoId: number, respostaData: Partial<RespostaUsuario>) => {
        setSession(prev => {
            if (!prev) return prev;

            const novasRespostas = [...prev.respostas];
            const respostaIndex = novasRespostas.findIndex(r => r.questaoId === questaoId);

            if (respostaIndex >= 0) {
                // Atualiza resposta existente
                novasRespostas[respostaIndex] = { ...novasRespostas[respostaIndex], ...respostaData };
            } else {
                // Adiciona nova resposta
                novasRespostas.push({ questaoId, ...respostaData } as RespostaUsuario);
            }

            return { ...prev, respostas: novasRespostas };
        });
    };

    const atualizarTempo = (segundosRestantes: number) => {
        setSession(prev => {
            if (!prev) return prev;
            return { ...prev, tempoRestanteSegundos: segundosRestantes };
        });
    };

    const finalizarSimulado = () => {
        setSession(prev => {
            if (!prev) return prev;
            return { ...prev, status: "PROCESSANDO" }; // Passa pro status de finalizado (mockup 2)
        });
    };

    const limparSessao = () => {
        setSession(null);
    };

    return (
        <SimuladoSessionContext.Provider
            value={{
                session,
                iniciarSessao,
                responderQuestao,
                atualizarTempo,
                finalizarSimulado,
                limparSessao
            }}
        >
            {isLoaded ? children : null}
        </SimuladoSessionContext.Provider>
    );
}

export function useSimuladoSession() {
    const context = useContext(SimuladoSessionContext);
    if (!context) {
        throw new Error("useSimuladoSession deve ser usado dentro de um SimuladoSessionProvider");
    }
    return context;
}
