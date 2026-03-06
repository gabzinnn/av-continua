"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
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
    iniciarSessao: (
        nome: string,
        email: string,
        tipo: string,
        dificuldade: string | undefined,
        qtdQuestoes: number
    ) => Promise<number | null>;
    responderQuestao: (questaoId: number, resposta: Partial<RespostaUsuario>) => void;
    atualizarTempo: (segundosRestantes: number) => void;
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

    // Load existing session from DB on mount
    useEffect(() => {
        (async () => {
            const storedId = localStorage.getItem(STORAGE_KEY);
            if (storedId) {
                try {
                    const sessao = await getSessaoSimulado(Number(storedId));
                    if (sessao && sessao.status === "EM_ANDAMENTO") {
                        setSession(mapSessaoToLocal(sessao as SessaoSimuladoCompleta));
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

    const iniciarSessao = async (
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
            localStorage.setItem(STORAGE_KEY, String(sessao.id));
            return sessao.id;
        } catch (err) {
            console.error("Erro ao criar sessão:", err);
            return null;
        }
    };

    const responderQuestao = (questaoId: number, respostaData: Partial<RespostaUsuario>) => {
        setSession(prev => {
            if (!prev) return prev;

            const novasRespostas = [...prev.respostas];
            const respostaIndex = novasRespostas.findIndex(r => r.questaoId === questaoId);

            if (respostaIndex >= 0) {
                novasRespostas[respostaIndex] = { ...novasRespostas[respostaIndex], ...respostaData };
            } else {
                novasRespostas.push({ questaoId, ...respostaData } as RespostaUsuario);
            }

            // Persist to DB asynchronously
            if (respostaData.respostaDiscursiva !== undefined) {
                responderQuestaoSimulado(prev.id, questaoId, respostaData.respostaDiscursiva || "").catch(console.error);
            }

            return { ...prev, respostas: novasRespostas };
        });
    };

    const atualizarTempo = (segundosRestantes: number) => {
        setSession(prev => {
            if (!prev) return prev;

            // Persist to DB every 10 seconds to avoid too many writes
            if (segundosRestantes % 10 === 0) {
                atualizarTempoSessao(prev.id, segundosRestantes).catch(console.error);
            }

            return { ...prev, tempoRestanteSegundos: segundosRestantes };
        });
    };

    const finalizarSimulado = () => {
        setSession(prev => {
            if (!prev) return prev;

            // Persist to DB
            finalizarSessaoSimulado(prev.id).catch(console.error);

            return { ...prev, status: "FINALIZADO" as const };
        });
    };

    const limparSessao = () => {
        localStorage.removeItem(STORAGE_KEY);
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
