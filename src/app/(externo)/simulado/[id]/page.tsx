"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { useSimuladoSession } from "@/src/app/(externo)/context";
import { CustomAlert, AlertType } from "@/src/app/components/CustomAlert";
import { Button } from "@/src/app/components/Button";

export default function RealizacaoSimuladoPage() {
    const { session, tempoRestante, responderQuestao, finalizarSimulado } = useSimuladoSession();
    const router = useRouter();
    const params = useParams();

    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [isMounted, setIsMounted] = useState(false);

    // Local textarea state for fluid typing (decoupled from context)
    const [localText, setLocalText] = useState("");
    const debounceRef = useRef<NodeJS.Timeout | null>(null);
    const currentQuestionIdRef = useRef<number | null>(null);

    // Alert Config
    const [alertConfig, setAlertConfig] = useState<{
        isOpen: boolean; type: AlertType; title: string; message: string;
        confirmText?: string; cancelText?: string; onConfirm: () => void; onCancel?: () => void;
    }>({ isOpen: false, type: "success", title: "", message: "", onConfirm: () => { } });

    const closeAlert = () => setAlertConfig(prev => ({ ...prev, isOpen: false }));

    useEffect(() => {
        setIsMounted(true);
    }, []);

    // Sync local text when switching questions
    useEffect(() => {
        if (!session) return;
        const question = session.questoes[currentQuestionIndex];
        if (!question) return;

        currentQuestionIdRef.current = question.id;
        const existing = session.respostas.find(r => r.questaoId === question.id);
        setLocalText(existing?.respostaDiscursiva || "");
    }, [currentQuestionIndex, session?.questoes, session?.id]);

    // Handle time up
    useEffect(() => {
        if (!isMounted || !session || session.status !== "EM_ANDAMENTO") return;
        if (tempoRestante <= 0) {
            finalizarSimulado();
            setTimeout(() => {
                router.replace(`/simulado/${session.id}/finalizado?reason=timeout`);
            }, 0);
        }
    }, [tempoRestante, isMounted, session?.status, session?.id]);

    // Validation & Routing
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

        if (session.status === "FINALIZADO") {
            router.replace(`/simulado/${session.id}/finalizado`);
            return;
        }
    }, [isMounted, session?.id, session?.status, params.id, router]);

    // Debounced text handler — types locally, syncs to context after 400ms idle
    const handleTextChange = useCallback((text: string) => {
        setLocalText(text);

        if (debounceRef.current) {
            clearTimeout(debounceRef.current);
        }

        const questionId = currentQuestionIdRef.current;
        if (!questionId) return;

        debounceRef.current = setTimeout(() => {
            responderQuestao(questionId, { respostaDiscursiva: text });
        }, 400);
    }, [responderQuestao]);

    // Flush debounce on question change or unmount
    useEffect(() => {
        return () => {
            if (debounceRef.current) {
                clearTimeout(debounceRef.current);
            }
        };
    }, [currentQuestionIndex]);

    const handleManuallyFinish = useCallback(() => {
        if (!session) return;
        const notAnswered = session.questoes.length - session.respostas.length;
        let message = "Deseja realmente finalizar o simulado agora?";
        if (notAnswered > 0) {
            message = `Você possui ${notAnswered} questão(ões) sem resposta. Questões não respondidas serão consideradas erradas. Deseja finalizar mesmo assim?`;
        }

        setAlertConfig({
            isOpen: true,
            type: "warning",
            title: "Finalizar Simulado",
            message,
            confirmText: "Sim, finalizar",
            cancelText: "Continuar respondendo",
            onConfirm: () => {
                // Flush any pending debounced answer
                if (debounceRef.current) {
                    clearTimeout(debounceRef.current);
                    if (currentQuestionIdRef.current && localText) {
                        responderQuestao(currentQuestionIdRef.current, { respostaDiscursiva: localText });
                    }
                }
                finalizarSimulado();
                closeAlert();
                setTimeout(() => {
                    router.replace(`/simulado/${session.id}/finalizado`);
                }, 0);
            },
            onCancel: closeAlert
        });
    }, [session, finalizarSimulado, responderQuestao, localText, router]);

    // Flush pending answer before navigating questions
    const navigateToQuestion = useCallback((idx: number) => {
        if (debounceRef.current) {
            clearTimeout(debounceRef.current);
            if (currentQuestionIdRef.current && localText) {
                responderQuestao(currentQuestionIdRef.current, { respostaDiscursiva: localText });
            }
        }
        setCurrentQuestionIndex(idx);
    }, [responderQuestao, localText]);

    if (!isMounted || !session || session.status !== "EM_ANDAMENTO") {
        return (
            <div className="w-full flex-1 flex items-center justify-center">
                <div className="w-8 h-8 rounded-full border-4 border-[#FAD419] border-t-transparent animate-spin"></div>
            </div>
        );
    }

    const currentQuestion = session.questoes[currentQuestionIndex];

    // Formatting time MM:SS
    const minutes = Math.floor(tempoRestante / 60);
    const seconds = tempoRestante % 60;
    const timeFormatted = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    const progressPerc = Math.round((session.respostas.length / session.questoes.length) * 100);

    return (
        <div className="w-full flex-1 flex flex-col bg-[#Fcfbf8]">
            <CustomAlert {...alertConfig} />

            {/* Context Header */}
            <div className="bg-white border-b border-gray-200 py-3 px-6 shadow-sm sticky top-0 z-40">
                <div className="max-w-[1200px] mx-auto flex items-center justify-between">
                    <div>
                        <h2 className="text-xs font-black text-text-main uppercase tracking-widest leading-tight">UFRJ Consulting Club</h2>
                        <span className="text-gray-400 text-[10px] uppercase font-bold tracking-wider">Simulado de {session.tipoSimulado}</span>
                    </div>

                    <div className="flex flex-col items-center bg-[#FCE98C]/20 px-8 py-2 rounded-xl border border-[#FAD419]/30">
                        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Tempo Restante</span>
                        <span className={`text-2xl font-black tabular-nums tracking-tight leading-none ${tempoRestante < 300 ? 'text-red-500' : 'text-text-main'}`}>
                            {timeFormatted}
                        </span>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="text-right hidden sm:block">
                            <h3 className="text-sm font-bold text-text-main leading-tight">{session.nomeUsuario}</h3>
                            <span className="text-[11px] text-gray-400 uppercase tracking-wider font-semibold">Candidato / Membro</span>
                        </div>
                        <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center border border-gray-200">
                            <span className="material-symbols-outlined text-gray-400">person</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Area */}
            <div className="flex-1 max-w-[1200px] mx-auto w-full p-6 lg:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

                {/* Left Area - Question */}
                <div className="lg:col-span-8 space-y-6">
                    <div className="bg-white rounded-[24px] shadow-sm border border-gray-200 p-8 lg:p-10 relative overflow-hidden">
                        {/* Status tag */}
                        <div className="flex items-center justify-between mb-8">
                            <div className="bg-[#FAD419] px-4 py-1.5 rounded-full inline-flex items-center shadow-sm">
                                <span className="text-xs font-black text-text-main uppercase tracking-widest">
                                    Questão {currentQuestionIndex + 1}
                                </span>
                            </div>
                            <span className="text-sm font-medium text-gray-400 flex items-center gap-2">
                                <span className="material-symbols-outlined text-[18px]">schedule</span>
                                Tempo sugerido: 2 min
                            </span>
                        </div>

                        {/* Enunciado */}
                        <div className="prose prose-sm sm:prose-base max-w-none text-text-main mb-10">
                            <h3 className="text-xl sm:text-2xl font-black mb-4 tracking-tight leading-tight">
                                Questão Analítica
                            </h3>
                            <p className="whitespace-pre-wrap leading-relaxed">
                                {currentQuestion.enunciado}
                            </p>
                        </div>

                        {/* Imagem caso exista */}
                        {currentQuestion.imagem && (
                            <div className="mb-10 rounded-xl overflow-hidden border border-gray-200 bg-gray-50 flex items-center justify-center min-h-[200px]">
                                <p className="text-gray-400 font-medium">Imagem Anexada: {currentQuestion.imagem}</p>
                            </div>
                        )}

                        {/* Resposta Discursiva */}
                        <div className="space-y-3">
                            <label className="text-sm font-bold text-gray-700 uppercase tracking-widest block">Sua Resposta</label>
                            <textarea
                                value={localText}
                                onChange={(e) => handleTextChange(e.target.value)}
                                className="w-full min-h-[200px] p-5 rounded-2xl border-2 border-gray-200 bg-gray-50 text-text-main focus:ring-4 focus:ring-[#FAD419]/20 focus:border-[#FAD419] outline-none transition-all placeholder:text-gray-400 resize-y text-base leading-relaxed"
                                placeholder="Estruture sua resposta lógica aqui..."
                            />
                        </div>
                    </div>

                    {/* Navigation Buttons */}
                    <div className="flex items-center justify-between gap-4">
                        <Button
                            variant="outline"
                            size="md"
                            onClick={() => navigateToQuestion(Math.max(0, currentQuestionIndex - 1))}
                            disabled={currentQuestionIndex === 0}
                            icon={<span className="material-symbols-outlined text-[20px]">chevron_left</span>}
                            iconPosition="left"
                        >
                            Anterior
                        </Button>

                        <span className="text-sm font-bold text-gray-400 hidden sm:block hover:text-gray-600 cursor-pointer transition-colors">
                            Revisar Depois
                        </span>

                        <Button
                            variant="primary"
                            size="md"
                            onClick={() => navigateToQuestion(Math.min(session.questoes.length - 1, currentQuestionIndex + 1))}
                            disabled={currentQuestionIndex === session.questoes.length - 1}
                            icon={<span className="material-symbols-outlined text-[20px]">chevron_right</span>}
                        >
                            Próxima
                        </Button>
                    </div>
                </div>

                {/* Right Area - Nav Grid */}
                <div className="lg:col-span-4 space-y-6">
                    <div className="bg-white rounded-[24px] shadow-sm border border-gray-200 p-6 lg:p-8">
                        <div className="flex items-center gap-2 mb-6">
                            <span className="material-symbols-outlined text-[#FAD419]">grid_view</span>
                            <h3 className="font-black text-text-main text-lg tracking-tight">Navegação da Prova</h3>
                        </div>

                        {/* Grid */}
                        <div className="grid grid-cols-5 gap-3 mb-8">
                            {session.questoes.map((q, idx) => {
                                const isAnswered = session.respostas.some(r => r.questaoId === q.id && r.respostaDiscursiva);
                                const isCurrent = currentQuestionIndex === idx;

                                return (
                                    <button
                                        key={q.id}
                                        onClick={() => navigateToQuestion(idx)}
                                        className={`
                                            h-12 w-full rounded-xl flex items-center justify-center text-sm font-black transition-all cursor-pointer
                                            ${isCurrent ? 'ring-2 ring-offset-2 ring-text-main ' : ''}
                                            ${isAnswered && !isCurrent ? 'bg-[#FAD419] text-text-main border border-[#FAD419]' : ''}
                                            ${!isAnswered && !isCurrent ? 'bg-gray-50 border border-gray-200 text-gray-400 hover:border-gray-300 hover:text-gray-600' : ''}
                                            ${isCurrent && isAnswered ? 'bg-[#FAD419] text-text-main' : ''}
                                            ${isCurrent && !isAnswered ? 'bg-white border-2 border-[#FAD419] text-text-main' : ''}
                                        `}
                                    >
                                        {idx + 1}
                                    </button>
                                );
                            })}
                        </div>

                        {/* Legenda */}
                        <div className="space-y-3 mb-8">
                            <div className="flex items-center gap-3">
                                <div className="w-3 h-3 rounded-full bg-[#FAD419]"></div>
                                <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Respondida</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="w-3 h-3 rounded-full border-2 border-[#FAD419] bg-white"></div>
                                <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Atual</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="w-3 h-3 rounded-full bg-gray-200"></div>
                                <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Pendente</span>
                            </div>
                        </div>

                        {/* Progress */}
                        <div className="space-y-2 mb-8 border-t border-gray-100 pt-8">
                            <div className="flex justify-between items-end mb-2">
                                <span className="text-sm font-black text-text-main">Progresso Geral</span>
                                <span className="text-lg font-black text-[#FAD419]">{progressPerc}%</span>
                            </div>
                            <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                                <div className="bg-[#FAD419] h-2.5 rounded-full transition-all duration-500 ease-out" style={{ width: `${progressPerc}%` }}></div>
                            </div>
                            <p className="text-[11px] text-gray-400 font-semibold text-center mt-2">
                                Questão {currentQuestionIndex + 1} de {session.questoes.length}
                            </p>
                        </div>

                        {/* Actions */}
                        <div className="space-y-3">
                            <Button
                                variant="secondary"
                                size="md"
                                fullWidth
                                onClick={handleManuallyFinish}
                                icon={<span className="material-symbols-outlined text-[20px]">task_alt</span>}
                                iconPosition="left"
                                className="bg-text-main! text-white! hover:bg-text-main/90!"
                            >
                                Finalizar Simulado
                            </Button>
                            <Button
                                variant="ghost"
                                size="md"
                                fullWidth
                                onClick={() => router.push('/simulado')}
                                className="text-red-500! border border-red-100 hover:bg-red-50!"
                            >
                                Interromper Teste
                            </Button>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
