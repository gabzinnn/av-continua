"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { useSimuladoSession } from "@/src/app/(externo)/context";

export default function SimuladoFinalizadoPage() {
    const { session } = useSimuladoSession();
    const router = useRouter();
    const params = useParams();
    const searchParams = useSearchParams();
    const [isMounted, setIsMounted] = useState(false);

    const reason = searchParams.get("reason"); // timeout ou manual

    useEffect(() => {
        setIsMounted(true);
    }, []);

    useEffect(() => {
        if (!isMounted) return;

        if (!session) {
            router.replace('/simulado');
            return;
        }

        if (session.id !== params.id) {
            router.replace('/simulado');
            return;
        }

        // Se ainda está em andamento, deve voltar pra prova.
        if (session.status === "EM_ANDAMENTO") {
            router.replace(`/simulado/${session.id}`);
            return;
        }

        // Após a animação de "Processando", permitir a tela final de transição redirecionar
        const timer = setTimeout(() => {
            if (session.status === "PROCESSANDO" || session.status === "FINALIZADO") {
                // Libera botão ver resultados ou auto-navega
                // Manteremos no clique manual do usuário pra seguir o Mockup
                // Na vida real você alteraria o status do Contexto de GRAVANDO DB para OK.
            }
        }, 1500);

        return () => clearTimeout(timer);
    }, [isMounted, session, params.id, router]);

    if (!isMounted || !session) return null;

    const isTimeout = reason === "timeout";

    return (
        <div className="w-full flex-1 flex flex-col pt-12 md:pt-24 items-center bg-[#Fcfbf8]">
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-12 w-full max-w-md text-center transform hover:-translate-y-1 transition-transform">

                <div className={`w-20 h-20 rounded-full mx-auto flex items-center justify-center mb-6 
                    ${isTimeout ? "bg-[#FCE98C]/20 text-[#FAD419]" : "bg-green-50 text-green-500"}`}>
                    <span className="material-symbols-outlined text-4xl">
                        {isTimeout ? "timer_off" : "task_alt"}
                    </span>
                </div>

                <h1 className="text-3xl font-black text-text-main mb-3 tracking-tight">
                    {isTimeout ? "Tempo Encerrado" : "Simulado Finalizado"}
                </h1>

                <p className="text-gray-500 text-sm mb-8 px-4 leading-relaxed">
                    {isTimeout
                        ? "Seu tempo acabou, mas não se preocupe! Suas respostas foram enviadas automaticamente."
                        : "Parabéns por concluir seu simulado. Suas respostas foram salvas com sucesso!"}
                </p>

                <div className="bg-gray-50 rounded-2xl p-4 mb-8 flex items-center justify-center gap-3 border border-gray-100">
                    <span className="material-symbols-outlined text-green-500">check_circle</span>
                    <div className="text-left">
                        <span className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest">Status do Envio</span>
                        <span className="font-semibold text-text-main text-sm">Respostas processadas</span>
                    </div>
                </div>

                <button
                    onClick={() => router.push(`/simulado/${session.id}/resultados`)}
                    className="w-full py-4 rounded-xl bg-[#FAD419] hover:bg-[#FAD419]/90 text-text-main font-black text-base shadow-sm active:scale-[0.98] transition-all flex items-center justify-center gap-3 cursor-pointer"
                >
                    Ver Resultados
                    <span className="material-symbols-outlined text-[20px]">leaderboard</span>
                </button>

                <div className="mt-8 flex justify-center gap-2 items-center">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                    <span className="text-[10px] uppercase font-bold text-gray-400 tracking-widest">Processamento Concluído</span>
                </div>
            </div>
        </div>
    );
}
