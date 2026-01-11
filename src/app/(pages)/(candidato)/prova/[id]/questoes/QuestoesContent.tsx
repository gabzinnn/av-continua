"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { useCandidato } from "../../../candidatoContext";
import {
    getProvaParaCandidato,
    salvarResposta,
    finalizarProva,
} from "@/src/actions/candidatoActions";
import { Button } from "@/src/app/components/Button";

// Types (Simplificados para o front)
type Questao = {
    id: number;
    tipo: string;
    enunciado: string;
    pontos: number;
    imagens: { id: number; url: string; ordem: number }[];
    alternativas: { id: number; texto: string; ordem: number }[];
};

type ProvaDados = {
    id: number;
    titulo: string;
    tempoLimite: number | null;
    questoes: Questao[];
};

interface QuestoesContentProps {
    provaId: number;
}

export default function QuestoesContent({ provaId }: QuestoesContentProps) {
    const router = useRouter();
    const { candidato, resultadoId, isRegistered } = useCandidato();

    const [loading, setLoading] = useState(true);
    const [prova, setProva] = useState<ProvaDados | null>(null);
    const [questoes, setQuestoes] = useState<Questao[]>([]);
    const [respostas, setRespostas] = useState<Record<number, number | string>>({});
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [tempoRestante, setTempoRestante] = useState<number | null>(null);
    const [saving, setSaving] = useState(false);
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const debounceRef = useRef<NodeJS.Timeout | null>(null);

    // Anti-cheat refs
    const tabSwitches = useRef(0);

    // Busca dados iniciais
    useEffect(() => {
        if (!isRegistered || !candidato || !resultadoId) {
            router.push("/prova");
            return;
        }

        const fetchData = async () => {
            try {
                const data = await getProvaParaCandidato(provaId, candidato.id);
                if (!data) {
                    alert("Erro ao carregar prova. Tente novamente.");
                    router.push("/prova");
                    return;
                }

                setProva(data.prova);
                setQuestoes(data.prova.questoes);
                setTempoRestante(data.tempoRestante);

                // Popula respostas já salvas
                const respostasMap: Record<number, number | string> = {};
                data.respostasSalvas.forEach((r: any) => {
                    if (r.alternativaId) respostasMap[r.questaoId] = r.alternativaId;
                    else if (r.respostaTexto) respostasMap[r.questaoId] = r.respostaTexto;
                });
                setRespostas(respostasMap);
                setLoading(false);
            } catch (error) {
                console.error(error);
            }
        };

        fetchData();
    }, [provaId, candidato, resultadoId, isRegistered, router]);

    // Timer
    useEffect(() => {
        if (tempoRestante !== null && tempoRestante > 0) {
            timerRef.current = setInterval(() => {
                setTempoRestante((prev) => {
                    if (prev === null || prev <= 1) {
                        // Will become 0 or less, stop here
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [tempoRestante]);

    // Separate effect to handle timeout
    useEffect(() => {
        if (tempoRestante === 0) {
            console.log("Acabou o tempo");
            handleFinalizarProva(true); // Acabou o tempo
        }
    }, [tempoRestante]);

    // Anti-cheat: Visibility Change
    const [showTabWarningModal, setShowTabWarningModal] = useState(false);

    useEffect(() => {
        const handleVisibilityChange = async () => {
            if (document.hidden) {
                tabSwitches.current += 1;
                console.log(`Tab switch count: ${tabSwitches.current}`);

                if (tabSwitches.current === 1) {
                    // Primeiro aviso - mostra modal
                    setShowTabWarningModal(true);
                } else if (tabSwitches.current >= 2) {
                    // Segunda troca - finaliza prova
                    if (resultadoId) {
                        await finalizarProva(resultadoId);
                        router.push("/prova/finalizada?reason=tabswitch");
                    }
                }
            }
        };

        document.addEventListener("visibilitychange", handleVisibilityChange);
        return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
    }, [resultadoId, router]);

    const handleSelectOption = async (questaoId: number, alternativaId: number) => {
        setRespostas((prev) => ({ ...prev, [questaoId]: alternativaId }));

        // Salva no background
        if (resultadoId) {
            await salvarResposta(resultadoId, questaoId, alternativaId, null);
        }
    };

    const handleFinalizarProva = async (isTimeout = false) => {
        if (!resultadoId) return;
        setLoading(true);
        await finalizarProva(resultadoId);
        // Redireciona para feedback ou home
        router.push(isTimeout ? "/prova/finalizada?reason=timeout" : "/prova/finalizada");
    };

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
    };

    if (loading || !prova) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-bg-main text-text-main">
                <div className="flex flex-col items-center gap-4">
                    <span className="material-symbols-outlined text-4xl animate-spin text-primary">progress_activity</span>
                    <p>Carregando prova...</p>
                </div>
            </div>
        );
    }

    const currentQuestion = questoes[currentQuestionIndex];
    const progressPercent = ((currentQuestionIndex + 1) / questoes.length) * 100;

    // Calculo do timer progress (assumindo que sabemos o tempo total original)
    // Sem tempo total original salvo no resultado (apenas iniciadoEm), vamos assumir o tempoLimite da prova
    // para calcular a porcentagem do timer.
    const totalTimeSeconds = (prova.tempoLimite || 60) * 60;
    const timerPercent = tempoRestante ? (tempoRestante / totalTimeSeconds) * 100 : 0;
    const timerCircleOffset = 100 - timerPercent; // Dasharray 100

    return (
        <div className="bg-bg-main min-h-screen flex flex-col overflow-x-hidden select-none">
            {/* Fixed Glass Header */}
            <header className="fixed top-0 left-0 right-0 z-50 h-[72px] px-6 lg:px-12 flex items-center justify-between transition-colors duration-300 bg-bg-main/85 backdrop-blur-md border-b border-border-ui">
                <div className="flex items-center gap-4">
                    <div className="flex flex-col">
                        <h1 className="text-sm font-semibold tracking-wide uppercase text-text-muted">
                            Avaliação
                        </h1>
                        <h2 className="text-base lg:text-lg font-bold text-text-main leading-tight">
                            {prova.titulo}
                        </h2>
                    </div>
                </div>
                <div className="flex items-center gap-6 lg:gap-10">
                    {/* Question Counter */}
                    <div className="hidden sm:flex items-center gap-2 px-4 py-1.5 bg-bg-card rounded-full border border-border-ui shadow-sm">
                        <span className="text-sm font-medium text-text-main">
                            Questão <span className="text-primary font-bold">{currentQuestionIndex + 1}</span>{" "}
                            <span className="text-text-muted">de {questoes.length}</span>
                        </span>
                    </div>
                    {/* Circular Timer */}
                    {tempoRestante !== null && (
                        <div className="flex items-center gap-3">
                            <div className="relative size-10 flex items-center justify-center">
                                <svg className="size-full" viewBox="0 0 36 36">
                                    <path
                                        className="text-gray-200 dark:text-stone-700"
                                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="3"
                                    />
                                    <path
                                        className="text-primary transition-[stroke-dashoffset] duration-350 ease-linear"
                                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeDasharray="100, 100"
                                        strokeDashoffset={timerCircleOffset} // Inverted logic logic for SVG circle usually
                                        strokeLinecap="round"
                                        strokeWidth="3"
                                        style={{
                                            transform: "rotate(-90deg)",
                                            transformOrigin: "50% 50%"
                                        }}
                                    />
                                </svg>
                                <span className="material-symbols-outlined absolute text-[18px] text-text-main">
                                    timer
                                </span>
                            </div>
                            <div className="flex flex-col items-start">
                                <span className="text-sm font-bold tabular-nums text-text-main">
                                    {formatTime(tempoRestante)}
                                </span>
                                <span className="text-[10px] uppercase font-medium text-text-muted tracking-wider">
                                    Restante
                                </span>
                            </div>
                        </div>
                    )}
                </div>
            </header>

            {/* Main Content Area */}
            <main className="grow pt-[100px] pb-32 px-4 sm:px-6 lg:px-8 flex flex-col items-center">
                {/* Progress Bar */}
                <div className="w-full max-w-4xl mb-8 flex flex-col gap-2">
                    <div className="flex justify-between items-end px-1">
                        <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">
                            Progresso da Prova
                        </span>
                        <span className="text-xs font-bold text-primary">
                            {Math.round(progressPercent)}%
                        </span>
                    </div>
                    <div className="h-1.5 w-full bg-stone-200 dark:bg-stone-800 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-primary rounded-full transition-all duration-500 ease-out"
                            style={{ width: `${progressPercent}%` }}
                        ></div>
                    </div>
                </div>

                {/* Question Card */}
                <div className="w-full max-w-4xl bg-bg-card rounded-xl shadow-sm border border-border-ui overflow-hidden flex flex-col min-h-[600px]">
                    {/* Question Content */}
                    <div className="p-6 md:p-8 lg:p-10 border-b border-border-ui grow">
                        <div className="flex items-start justify-between gap-4 mb-6">
                            <span className="inline-flex items-center justify-center px-3 py-1 bg-primary/10 text-yellow-700 text-xs font-bold uppercase tracking-wider rounded-md">
                                {currentQuestion.tipo === "MULTIPLA_ESCOLHA" ? "Múltipla Escolha" : "Discursiva"}
                            </span>
                            <div className="flex gap-2 text-text-muted">
                                {/* Bookmarks could go here */}
                            </div>
                        </div>

                        <div className="flex flex-col lg:flex-row gap-8">
                            <div className="flex-1 space-y-4">
                                <h3 className="text-xl md:text-2xl font-medium text-text-main leading-relaxed">
                                    {currentQuestion.enunciado}
                                </h3>
                                <p className="text-text-muted text-base leading-relaxed">
                                    Valor: {currentQuestion.pontos} pontos
                                </p>
                            </div>

                            {/* Images */}
                            {currentQuestion.imagens && currentQuestion.imagens.length > 0 && (
                                <div className="lg:w-1/3 shrink-0 flex flex-col gap-2">
                                    {currentQuestion.imagens.map((img, idx) => (
                                        <div key={img.id} className="aspect-4/3 rounded-lg bg-stone-100 overflow-hidden border border-border-ui relative group">
                                            <img src={img.url} alt={`Imagem ${idx + 1}`} className="w-full h-full object-cover" />
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Answer Section */}
                    <div className="bg-bg-main/50 p-6 md:p-8 lg:p-10">
                        {currentQuestion.tipo === "DISSERTATIVA" ? (
                            <div className="flex flex-col gap-2">
                                <p className="text-text-muted">Escreva sua resposta abaixo:</p>
                                <textarea
                                    className="w-full min-h-[160px] p-4 rounded-lg bg-bg-card border border-border-ui focus:border-primary focus:ring-1 focus:ring-primary outline-none resize-y text-text-main"
                                    placeholder="Digite sua resposta detalhada..."
                                    value={(respostas[currentQuestion.id] as string) || ""}
                                    onChange={(e) => {
                                        const newValue = e.target.value;
                                        setRespostas((prev) => ({ ...prev, [currentQuestion.id]: newValue }));

                                        // Debounce manual
                                        if (debounceRef.current) clearTimeout(debounceRef.current);
                                        debounceRef.current = setTimeout(() => {
                                            if (resultadoId) {
                                                salvarResposta(resultadoId, currentQuestion.id, null, newValue);
                                            }
                                        }, 1000);
                                    }}
                                />
                            </div>
                        ) : (
                            /* MULTIPLA_ESCOLHA e VERDADEIRO_FALSO */
                            <div className={`grid gap-4 ${currentQuestion.tipo === "VERDADEIRO_FALSO" ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1"}`}>
                                <div className="col-span-full">
                                    <p className="text-sm font-semibold text-text-muted mb-2">
                                        {currentQuestion.tipo === "VERDADEIRO_FALSO" ? "Selecione uma opção:" : "Selecione uma alternativa:"}
                                    </p>
                                </div>
                                {currentQuestion.alternativas.map((alt, idx) => {
                                    const isSelected = respostas[currentQuestion.id] === alt.id;
                                    const letter = String.fromCharCode(65 + idx); // A, B, C...
                                    const isVF = currentQuestion.tipo === "VERDADEIRO_FALSO";

                                    // Logic for V/F determination
                                    // Use index as fallback if text is missing or unidentifiable
                                    let isTrueVariant = false;
                                    let isFalseVariant = false;

                                    if (isVF) {
                                        const text = alt.texto?.toLowerCase().trim() || "";
                                        if (text.includes("verdadeiro") || text === "v") isTrueVariant = true;
                                        else if (text.includes("falso") || text === "f") isFalseVariant = true;
                                        else {
                                            // Fallback by index
                                            if (idx === 0) isTrueVariant = true;
                                            else if (idx === 1) isFalseVariant = true;
                                        }
                                    }

                                    // Fallback text
                                    const fallbackText = isVF ? (isTrueVariant ? "Verdadeiro" : "Falso") : "";
                                    const displayText = alt.texto?.trim() ? alt.texto : fallbackText;

                                    return (
                                        <label
                                            key={alt.id}
                                            className="group cursor-pointer relative h-full block"
                                        >
                                            <input
                                                type="radio"
                                                name={`question_${currentQuestion.id}`}
                                                className="peer sr-only"
                                                value={alt.id}
                                                checked={isSelected}
                                                onChange={() => handleSelectOption(currentQuestion.id, alt.id)}
                                            />
                                            <div className={`flex items-center p-4 md:p-5 rounded-lg border-2 transition-all h-full
                                            ${isSelected
                                                    ? "border-primary bg-primary/5 shadow-[0_0_0_1px_#fad519]"
                                                    : "border-border-ui bg-bg-card hover:border-secondary"
                                                }`}>
                                                <div className={`shrink-0 size-6 rounded-full border-2 mr-4 flex items-center justify-center transition-colors
                                                ${isSelected
                                                        ? "border-primary bg-primary"
                                                        : "border-stone-300 group-hover:border-primary/50"
                                                    }`}>
                                                    {isSelected && <span className="material-symbols-outlined text-[16px] text-black font-bold">check</span>}
                                                </div>
                                                <div className="grow flex items-center gap-2">
                                                    <span className={`text-base font-medium group-hover:text-text-main ${isSelected ? "text-text-main" : "text-text-main"}`}>
                                                        {displayText}
                                                    </span>
                                                    {isVF && (isTrueVariant || isFalseVariant) && (
                                                        <span className={`text-xs px-2 py-0.5 rounded font-bold uppercase ml-2
                                                        ${isTrueVariant ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}
                                                    `}>
                                                            {isTrueVariant ? "V" : "F"}
                                                        </span>
                                                    )}
                                                </div>
                                                {!isVF && (
                                                    <span className={`text-sm font-bold ml-2 ${isSelected ? "text-primary" : "text-text-muted opacity-50"}`}>
                                                        {letter}
                                                    </span>
                                                )}
                                            </div>
                                        </label>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </main>

            {/* Footer Navigation */}
            <div className="fixed bottom-0 left-0 right-0 bg-bg-card/90 backdrop-blur-md border-t border-border-ui py-4 px-6 lg:px-12 z-40">
                <div className="max-w-4xl mx-auto w-full flex items-center justify-between">
                    {/* Jump List (Desktop) - Disabled for backward nav */}
                    <div className="hidden md:flex gap-1">
                        {questoes.map((_, idx) => (
                            <div
                                key={idx}
                                className={`w-2 h-2 rounded-full 
                        ${idx === currentQuestionIndex ? "bg-primary" : idx < currentQuestionIndex ? "bg-primary/40" : "bg-stone-200"}`}
                            />
                        ))}
                    </div>

                    {currentQuestionIndex < questoes.length - 1 ? (
                        <button
                            onClick={() => setCurrentQuestionIndex((prev) => Math.min(questoes.length - 1, prev + 1))}
                            className="flex items-center gap-2 px-8 py-2.5 rounded-lg bg-primary hover:bg-primary/90 text-text-main font-bold shadow-md shadow-primary/20 transition-all active:scale-95 group cursor-pointer"
                        >
                            <span>Próxima Questão</span>
                            <span className="material-symbols-outlined transition-transform group-hover:translate-x-1" style={{ fontSize: "20px" }}>
                                arrow_forward
                            </span>
                        </button>
                    ) : (
                        <button
                            onClick={() => handleFinalizarProva(false)}
                            className="flex items-center gap-2 px-8 py-2.5 rounded-lg bg-green-500 hover:bg-green-600 text-white font-bold shadow-md shadow-green-500/20 transition-all active:scale-95 group cursor-pointer"
                        >
                            <span>Finalizar Prova</span>
                            <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>
                                check
                            </span>
                        </button>
                    )}
                </div>
            </div>

            {/* Tab Switch Warning Modal */}
            {showTabWarningModal && (
                <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md mx-4 animate-in fade-in zoom-in duration-200">
                        <div className="flex flex-col items-center text-center gap-4">
                            <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center">
                                <span className="material-symbols-outlined text-amber-600" style={{ fontSize: "32px" }}>
                                    warning
                                </span>
                            </div>
                            <h2 className="text-xl font-bold text-text-main">
                                Atenção!
                            </h2>
                            <p className="text-text-muted">
                                Você saiu da aba da prova. Esta é uma <span className="font-bold text-amber-600">advertência</span>.
                            </p>
                            <p className="text-sm text-red-600 font-semibold bg-red-50 px-4 py-2 rounded-lg">
                                Na próxima troca de aba, sua prova será finalizada automaticamente.
                            </p>
                            <button
                                onClick={() => setShowTabWarningModal(false)}
                                className="mt-2 px-8 py-3 bg-primary hover:bg-primary-hover text-white font-bold rounded-lg transition-colors cursor-pointer"
                            >
                                Entendi, continuar prova
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
