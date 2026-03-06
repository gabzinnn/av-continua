"use client";

import { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from "react";
import {
    criarSessaoSimulado,
    getSessaoSimulado,
    responderQuestaoSimulado,
    atualizarTempoSessao,
    finalizarSessaoSimulado,
    type SessaoSimuladoCompleta,
} from "@/src/actions/simuladosActions";

// Interface for user responses in-memory (the actual data is in DB)
export interface RespostaUsuario {
    questaoId: number;
    respostaDiscursiva?: string;
}

// Flat question for rendering (extracted from DB join)
export interface QuestaoFlat {
    id: number;
    enunciado: string;
    banco: string;
    dificuldade: string | null;
    respostaModelo: string | null;
    imagem: string | null;
}

export interface SimuladoSession {
    id: number;
    nomeUsuario: string;
    emailUsuario: string;
    tipoSimulado: string;
    dificuldade?: string;
    questoes: QuestaoFlat[];
    respostas: RespostaUsuario[];
    tempoTotalSegundos: number;
    tempoRestanteSegundos: number;
    dataCriacao: string;
    status: "EM_ANDAMENTO" | "FINALIZADO";
}

interface SimuladoSessionContextType {
    session: SimuladoSession | null;
    tempoRestante: number;
    iniciarSessao: (
        nome: string,
        email: string,
        tipo: string,
        dificuldade: string | undefined,
        qtdQuestoes: number
    ) => Promise<number | null>;
    responderQuestao: (questaoId: number, resposta: Partial<RespostaUsuario>) => void;
    finalizarSimulado: () => void;
    limparSessao: () => void;
}

const SimuladoSessionContext = createContext<SimuladoSessionContextType | null>(null);

const STORAGE_KEY = "@AVContinua:simulado_session_id";

function mapSessaoToLocal(sessao: SessaoSimuladoCompleta): SimuladoSession {
    return {
        id: sessao.id,
        nomeUsuario: sessao.nomeUsuario,
        emailUsuario: sessao.emailUsuario,
        tipoSimulado: sessao.tipoSimulado,
        dificuldade: sessao.dificuldade || undefined,
        questoes: sessao.questoes.map(sq => ({
            id: sq.questao.id,
            enunciado: sq.questao.enunciado,
            banco: sq.questao.banco,
            dificuldade: sq.questao.dificuldade,
            respostaModelo: sq.questao.respostaModelo,
            imagem: sq.questao.imagemUrl,
        })),
        respostas: sessao.respostas.map(r => ({
            questaoId: r.questaoId,
            respostaDiscursiva: r.respostaDiscursiva || undefined,
        })),
        tempoTotalSegundos: sessao.tempoTotalSegundos,
        tempoRestanteSegundos: sessao.tempoRestanteSegundos,
        dataCriacao: sessao.createdAt.toISOString ? sessao.createdAt.toISOString() : String(sessao.createdAt),
        status: sessao.status as "EM_ANDAMENTO" | "FINALIZADO",
    };
}

export function SimuladoSessionProvider({ children }: { children: ReactNode }) {
    const [session, setSession] = useState<SimuladoSession | null>(null);
    const [isLoaded, setIsLoaded] = useState(false);

    // Timer lives in its own state to avoid re-rendering the entire tree on every tick
    const [tempoRestante, setTempoRestante] = useState(0);
    const tempoRef = useRef(0);
    const sessionIdRef = useRef<number | null>(null);

    // Load existing session from DB on mount
    useEffect(() => {
        (async () => {
            const storedId = localStorage.getItem(STORAGE_KEY);
            if (storedId) {
                try {
                    const sessao = await getSessaoSimulado(Number(storedId));
                    if (sessao && sessao.status === "EM_ANDAMENTO") {
                        const mapped = mapSessaoToLocal(sessao as SessaoSimuladoCompleta);
                        setSession(mapped);
                        setTempoRestante(mapped.tempoRestanteSegundos);
                        tempoRef.current = mapped.tempoRestanteSegundos;
                        sessionIdRef.current = mapped.id;
                    } else {
                        localStorage.removeItem(STORAGE_KEY);
                    }
                } catch (e) {
                    console.error("Erro ao carregar sessão:", e);
                    localStorage.removeItem(STORAGE_KEY);
                }
            }
            setIsLoaded(true);
        })();
    }, []);

    // Autonomous timer — ticks via setInterval, only updates React state for display
    useEffect(() => {
        if (!session || session.status !== "EM_ANDAMENTO") return;

        const interval = setInterval(() => {
            tempoRef.current -= 1;

            // Update display state
            setTempoRestante(tempoRef.current);

            // Persist to DB every 10 seconds
            if (tempoRef.current % 10 === 0 && sessionIdRef.current) {
                atualizarTempoSessao(sessionIdRef.current, tempoRef.current).catch(console.error);
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [session?.id, session?.status]);

    const iniciarSessao = useCallback(async (
        nome: string,
        email: string,
        tipo: string,
        dificuldade: string | undefined,
        qtdQuestoes: number
    ): Promise<number | null> => {
        try {
            const sessao = await criarSessaoSimulado(nome, email, tipo, dificuldade, qtdQuestoes);
            if (!sessao) return null;

            const localSession = mapSessaoToLocal(sessao as SessaoSimuladoCompleta);
            setSession(localSession);
            setTempoRestante(localSession.tempoRestanteSegundos);
            tempoRef.current = localSession.tempoRestanteSegundos;
            sessionIdRef.current = localSession.id;
            localStorage.setItem(STORAGE_KEY, String(sessao.id));
            return sessao.id;
        } catch (err) {
            console.error("Erro ao criar sessão:", err);
            return null;
        }
    }, []);

    const responderQuestao = useCallback((questaoId: number, respostaData: Partial<RespostaUsuario>) => {
        setSession(prev => {
            if (!prev) return prev;

            const novasRespostas = [...prev.respostas];
            const respostaIndex = novasRespostas.findIndex(r => r.questaoId === questaoId);

            if (respostaIndex >= 0) {
                novasRespostas[respostaIndex] = { ...novasRespostas[respostaIndex], ...respostaData };
            } else {
                novasRespostas.push({ questaoId, ...respostaData } as RespostaUsuario);
            }

            return { ...prev, respostas: novasRespostas };
        });

        // Side effect OUTSIDE the state updater — this fixes the Router error
        if (respostaData.respostaDiscursiva !== undefined && sessionIdRef.current) {
            responderQuestaoSimulado(sessionIdRef.current, questaoId, respostaData.respostaDiscursiva || "").catch(console.error);
        }
    }, []);

    const finalizarSimulado = useCallback(() => {
        const sessaoId = sessionIdRef.current;

        // Update state (pure, no side effects)
        setSession(prev => {
            if (!prev) return prev;
            return { ...prev, status: "FINALIZADO" as const };
        });

        // Side effect OUTSIDE the state updater — this fixes the Router error
        if (sessaoId) {
            finalizarSessaoSimulado(sessaoId).catch(console.error);
        }
    }, []);

    const limparSessao = useCallback(() => {
        localStorage.removeItem(STORAGE_KEY);
        sessionIdRef.current = null;
        setSession(null);
    }, []);

    return (
        <SimuladoSessionContext.Provider
            value={{
                session,
                tempoRestante,
                iniciarSessao,
                responderQuestao,
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
