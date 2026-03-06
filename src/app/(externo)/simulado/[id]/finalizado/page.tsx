"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { useSimuladoSession } from "@/src/app/(externo)/context";
import { Button } from "@/src/app/components/Button";

export default function SimuladoFinalizadoPage() {
    const { session } = useSimuladoSession();
    const router = useRouter();
    const params = useParams();
    const searchParams = useSearchParams();
    const [isMounted, setIsMounted] = useState(false);
    const [isProcessing, setIsProcessing] = useState(true);

    const reason = searchParams.get("reason");

    useEffect(() => {
        setIsMounted(true);
    }, []);

    useEffect(() => {
        if (!isMounted) return;

        if (!session) {
            router.replace('/simulado');
            return;
        }

        if (session.id !== Number(params.id)) {
            router.replace('/simulado');
            return;
        }

        if (session.status === "EM_ANDAMENTO") {
            router.replace(`/simulado/${session.id}`);
            return;
        }

        const timer = setTimeout(() => {
            if (session.status === "FINALIZADO") {
                setIsProcessing(false);
            }
        }, 1500);

        return () => clearTimeout(timer);
    }, [isMounted, session, params.id, router]);

    if (!isMounted || !session) {
        return (
            <div className="w-full flex-1 flex items-center justify-center min-h-[50vh]">
                <div className="w-8 h-8 rounded-full border-4 border-[#FAD419] border-t-transparent animate-spin"></div>
            </div>
        );
    }

    if (isProcessing) {
        return (
            <div className="w-full flex-1 flex flex-col items-center justify-center min-h-[50vh] space-y-4">
                <div className="w-10 h-10 rounded-full border-4 border-[#FAD419] border-t-transparent animate-spin"></div>
                <h2 className="text-lg font-black text-text-main tracking-tight animate-pulse">
                    Processando respostas...
                </h2>
            </div>
        );
    }

    const isTimeout = reason === "timeout";

    return (
        <div className="w-full flex-1 flex items-center justify-center p-6 bg-linear-to-br from-[#FAD419]/5 via-transparent to-[#FAD419]/10">
            <div className="w-full max-w-[520px] bg-white rounded-[24px] shadow-xl border border-gray-100 p-8 md:p-12 text-center">

                {/* Icon */}
                <div className="w-24 h-24 mx-auto mb-8 rounded-full bg-[#FCE98C]/30 flex items-center justify-center relative border border-[#FAD419]/20">
                    <div className="absolute inset-0 animate-pulse bg-[#FAD419]/10 rounded-full"></div>
                    <span className="material-symbols-outlined text-5xl text-text-main">
                        {isTimeout ? "timer_off" : "task_alt"}
                    </span>
                </div>

                {/* Title & Message */}
                <div className="mb-8">
                    <h1 className="text-3xl font-black text-text-main mb-4 tracking-tight">
                        {isTimeout ? "Tempo Encerrado" : "Simulado Finalizado"}
                    </h1>
                    <p className="text-gray-500 text-lg leading-relaxed">
                        {isTimeout
                            ? "Seu tempo acabou, mas não se preocupe! Suas respostas foram enviadas automaticamente."
                            : "Parabéns por concluir seu simulado! Suas respostas foram salvas com sucesso."
                        }
                    </p>
                </div>

                {/* Status Badge */}
                <div className="bg-gray-50 rounded-2xl p-4 mb-8 border border-gray-100 flex items-center gap-3 text-left">
                    <span className="material-symbols-outlined text-[#FAD419] text-2xl">check_circle</span>
                    <div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Status do Envio</p>
                        <p className="text-sm font-semibold text-text-main">Simulado finalizado com sucesso</p>
                    </div>
                </div>

                {/* CTA */}
                <div className="pt-2">
                    <Button
                        fullWidth
                        size="lg"
                        onClick={() => setTimeout(() => router.push(`/simulado/${session.id}/resultados`), 0)}
                        icon={<span className="material-symbols-outlined text-[20px]">analytics</span>}
                    >
                        Ver Resultados
                    </Button>
                </div>

                {/* Footer */}
                <div className="mt-8 pt-8 border-t border-gray-100 flex items-center justify-center">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-500"></div>
                        <span className="text-[11px] uppercase font-bold text-gray-400 tracking-widest">Processamento Concluído</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
