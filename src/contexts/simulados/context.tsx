"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";

export type BancoQuestao = "GMAT" | "Business Case";
export type DificuldadeQuestao = "Fácil" | "Médio" | "Difícil";

export interface QuestaoSimulado {
    id: number;
    enunciado: string;
    banco: BancoQuestao;
    data: string;
    colorBanco: string;
    dificuldade?: string;
    respostaModelo?: string;
    imagem?: string | null;
}

const defaultQuestions: QuestaoSimulado[] = [
    {
        id: 1,
        enunciado: "Considerando uma empresa de varejo com queda de 15% no EBITDA, quais as alavancas de rentabilidade...",
        banco: "Business Case",
        data: "12 Out 2023",
        colorBanco: "blue"
    },
    {
        id: 2,
        enunciado: "If x is an integer and y = x^2 + 5x + 6, which of the following must be true about the parity of y?",
        banco: "GMAT",
        data: "10 Out 2023",
        colorBanco: "purple"
    },
    {
        id: 3,
        enunciado: "Qual é o custo de aquisição de cliente (CAC) aceitável para um LTV de R$ 500 num modelo SaaS B2B?",
        banco: "Business Case",
        data: "05 Set 2023",
        colorBanco: "blue"
    },
    {
        id: 4,
        enunciado: "What is the greatest prime factor of 4^17 - 2^28?",
        banco: "GMAT",
        data: "01 Set 2023",
        colorBanco: "purple"
    },
    {
        id: 5,
        enunciado: "Como estruturar um framework para avaliar a entrada de um banco de varejo no mercado de crédito rural?",
        banco: "Business Case",
        data: "20 Ago 2023",
        colorBanco: "blue"
    }
];

interface SimuladosContextProps {
    questoes: QuestaoSimulado[];
    addQuestao: (questao: Omit<QuestaoSimulado, "id" | "data" | "colorBanco">) => void;
    deleteQuestao: (id: number) => void;
    editQuestao: (id: number, questao: Partial<QuestaoSimulado>) => void;
}

const SimuladosContext = createContext<SimuladosContextProps | undefined>(undefined);

export function SimuladosProvider({ children }: { children: ReactNode }) {
    const [questoes, setQuestoes] = useState<QuestaoSimulado[]>([]);

    useEffect(() => {
        // Hydrate from localStorage if available, otherwise use defaults
        const stored = localStorage.getItem("simulados_questoes");
        if (stored) {
            try {
                setQuestoes(JSON.parse(stored));
            } catch (e) {
                setQuestoes(defaultQuestions);
            }
        } else {
            setQuestoes(defaultQuestions);
        }
    }, []);

    // Save to localStorage on change
    useEffect(() => {
        if (questoes.length > 0) {
            localStorage.setItem("simulados_questoes", JSON.stringify(questoes));
        }
    }, [questoes]);

    const addQuestao = (questao: Omit<QuestaoSimulado, "id" | "data" | "colorBanco">) => {
        const newId = questoes.length > 0 ? Math.max(...questoes.map(q => q.id)) + 1 : 1;
        const colorBanco = questao.banco === "Business Case" ? "blue" : "purple";
        const today = new Date();
        const dataStr = `${today.getDate().toString().padStart(2, '0')} ${['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'][today.getMonth()]} ${today.getFullYear()}`;

        const newQuestao: QuestaoSimulado = {
            ...questao,
            id: newId,
            data: dataStr,
            colorBanco,
        };

        setQuestoes(prev => [newQuestao, ...prev]);
    };

    const deleteQuestao = (id: number) => {
        setQuestoes(prev => prev.filter(q => q.id !== id));
    };

    const editQuestao = (id: number, updatedFields: Partial<QuestaoSimulado>) => {
        setQuestoes(prev => prev.map(q => q.id === id ? { ...q, ...updatedFields } : q));
    };

    return (
        <SimuladosContext.Provider value={{ questoes, addQuestao, deleteQuestao, editQuestao }}>
            {children}
        </SimuladosContext.Provider>
    );
}

export function useSimulados() {
    const context = useContext(SimuladosContext);
    if (!context) {
        throw new Error("useSimulados must be used within a SimuladosProvider");
    }
    return context;
}
