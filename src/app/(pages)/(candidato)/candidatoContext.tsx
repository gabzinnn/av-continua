"use client";

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";

interface Candidato {
    id: number;
    nome: string;
    email: string;
    curso: string | null;
    periodo: string | null;
    dre: string;
}

interface CandidatoContextType {
    candidato: Candidato | null;
    resultadoId: number | null;
    provaId: number | null;
    isLoading: boolean;
    isRegistered: boolean;
    registrar: (candidato: Candidato, resultadoId: number, provaId: number) => void;
    limpar: () => void;
}

const CandidatoContext = createContext<CandidatoContextType | null>(null);

const STORAGE_KEY = "@AVContinua:candidato";
const RESULTADO_KEY = "@AVContinua:resultadoId";
const PROVA_KEY = "@AVContinua:provaId";

interface CandidatoProviderProps {
    children: ReactNode;
}

export function CandidatoProvider({ children }: CandidatoProviderProps) {
    const [candidato, setCandidato] = useState<Candidato | null>(null);
    const [resultadoId, setResultadoId] = useState<number | null>(null);
    const [provaId, setProvaId] = useState<number | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Carrega do sessionStorage ao iniciar
    useEffect(() => {
        const storedCandidato = sessionStorage.getItem(STORAGE_KEY);
        const storedResultadoId = sessionStorage.getItem(RESULTADO_KEY);
        const storedProvaId = sessionStorage.getItem(PROVA_KEY);

        if (storedCandidato) {
            try {
                setCandidato(JSON.parse(storedCandidato));
            } catch {
                sessionStorage.removeItem(STORAGE_KEY);
            }
        }

        if (storedResultadoId) {
            setResultadoId(Number(storedResultadoId));
        }

        if (storedProvaId) {
            setProvaId(Number(storedProvaId));
        }

        setIsLoading(false);
    }, []);

    const registrar = useCallback((cand: Candidato, resId: number, prvId: number) => {
        setCandidato(cand);
        setResultadoId(resId);
        setProvaId(prvId);
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(cand));
        sessionStorage.setItem(RESULTADO_KEY, String(resId));
        sessionStorage.setItem(PROVA_KEY, String(prvId));
    }, []);

    const limpar = useCallback(() => {
        setCandidato(null);
        setResultadoId(null);
        setProvaId(null);
        sessionStorage.removeItem(STORAGE_KEY);
        sessionStorage.removeItem(RESULTADO_KEY);
        sessionStorage.removeItem(PROVA_KEY);
    }, []);

    return (
        <CandidatoContext.Provider
            value={{
                candidato,
                resultadoId,
                provaId,
                isLoading,
                isRegistered: !!candidato && !!resultadoId,
                registrar,
                limpar,
            }}
        >
            {children}
        </CandidatoContext.Provider>
    );
}

export function useCandidato() {
    const context = useContext(CandidatoContext);
    if (!context) {
        throw new Error("useCandidato deve ser usado dentro de um CandidatoProvider");
    }
    return context;
}
