import Link from "next/link";
import { getResultadosSimulado, type ClassificacaoResposta } from "@/src/actions/simuladosActions";
import { redirect } from "next/navigation";
import { renderMathInHtml } from "@/src/utils/mathUtils";

interface ResultadosPageProps {
    params: Promise<{ id: string }>;
}

// Classificação visual por tipo
const classificacaoConfig: Record<ClassificacaoResposta, {
    label: string;
    icon: string;
    badgeBg: string;
    badgeText: string;
    borderColor: string;
    userBoxBg: string;
    userBoxBorder: string;
    userBoxLabel: string;
    userBoxText: string;
}> = {
    CORRETA: {
        label: "ACERTO",
        icon: "check_circle",
        badgeBg: "bg-green-100",
        badgeText: "text-green-700",
        borderColor: "border-l-green-500",
        userBoxBg: "bg-green-50/50",
        userBoxBorder: "border-green-100",
        userBoxLabel: "text-green-600",
        userBoxText: "text-green-800",
    },
    INCORRETA: {
        label: "ERRO",
        icon: "cancel",
        badgeBg: "bg-red-100",
        badgeText: "text-red-700",
        borderColor: "border-l-red-400",
        userBoxBg: "bg-red-50/50",
        userBoxBorder: "border-red-100",
        userBoxLabel: "text-red-500",
        userBoxText: "text-red-700",
    },
    NAO_RESPONDIDA: {
        label: "NÃO RESPONDIDA",
        icon: "do_not_disturb_on",
        badgeBg: "bg-gray-100",
        badgeText: "text-gray-600",
        borderColor: "border-l-gray-300",
        userBoxBg: "bg-gray-50",
        userBoxBorder: "border-gray-100",
        userBoxLabel: "text-gray-400",
        userBoxText: "text-gray-400",
    },
};

export default async function SimuladoResultadosPage({ params }: ResultadosPageProps) {
    const { id } = await params;
    const resultados = await getResultadosSimulado(Number(id));

    if (!resultados) {
        redirect("/simulado");
    }

    const tempoGasto = resultados.tempoTotalSegundos - resultados.tempoRestanteSegundos;
    const minutosGastos = Math.floor(tempoGasto / 60);
    const segundosGastos = tempoGasto % 60;

    return (
        <div className="w-full flex-1 flex flex-col bg-[#Fcfbf8]">
            {/* Context Header */}
            <div className="bg-white border-b border-gray-200 py-3 px-6 shadow-sm sticky top-0 z-40">
                <div className="max-w-[1000px] mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <span className="text-gray-400 text-sm font-medium">Simulado Finalizado</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-[#FAD419] text-xl">account_circle</span>
                        <span className="text-sm font-semibold text-text-main">{resultados.nomeUsuario}</span>
                    </div>
                </div>
            </div>

            <div className="max-w-[1000px] mx-auto w-full p-6 md:p-10 space-y-10">

                {/* Score Header */}
                <section className="bg-white rounded-[24px] shadow-sm border border-gray-100 p-8 text-center md:text-left flex flex-col md:flex-row items-center justify-between gap-8">
                    <div>
                        <h1 className="text-3xl font-black text-text-main mb-2 tracking-tight">Gabarito e Resultados</h1>
                        <p className="text-gray-500">Confira abaixo o seu desempenho detalhado no simulado de <strong>{resultados.tipoSimulado}</strong>.</p>
                    </div>
                    <div className="flex items-center gap-6 bg-gray-50 p-6 rounded-2xl border border-gray-100 shrink-0">
                        <div className="text-center">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">Precisão Estimada</p>
                            <p className="text-4xl font-black text-text-main">
                                {resultados.percentualAcerto}
                                <span className="text-gray-400 text-2xl font-normal">%</span>
                            </p>
                        </div>
                        <div className="w-16 h-16 bg-white rounded-full border-4 border-[#FAD419] flex items-center justify-center shadow-inner">
                            <span className="material-symbols-outlined text-[#FAD419] text-3xl">military_tech</span>
                        </div>
                    </div>
                </section>

                {/* Stats Row */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-white rounded-2xl border border-gray-100 p-4 text-center">
                        <span className="material-symbols-outlined text-green-500 text-2xl mb-1">check_circle</span>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Acertos</p>
                        <p className="text-xl font-black text-green-600">{resultados.acertos}</p>
                    </div>
                    <div className="bg-white rounded-2xl border border-gray-100 p-4 text-center">
                        <span className="material-symbols-outlined text-red-500 text-2xl mb-1">cancel</span>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Erros</p>
                        <p className="text-xl font-black text-red-500">{resultados.erros}</p>
                    </div>
                    <div className="bg-white rounded-2xl border border-gray-100 p-4 text-center">
                        <span className="material-symbols-outlined text-gray-400 text-2xl mb-1">do_not_disturb_on</span>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Sem Resposta</p>
                        <p className="text-xl font-black text-gray-500">{resultados.naoRespondidas}</p>
                    </div>
                    <div className="bg-white rounded-2xl border border-gray-100 p-4 text-center">
                        <span className="material-symbols-outlined text-blue-500 text-2xl mb-1">schedule</span>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Tempo Gasto</p>
                        <p className="text-xl font-black text-text-main">{minutosGastos}:{segundosGastos.toString().padStart(2, '0')}</p>
                    </div>
                </div>

                {/* Questions Review */}
                <div className="space-y-6">
                    <h3 className="text-xl font-black flex items-center gap-2 px-2 text-text-main">
                        <span className="material-symbols-outlined">fact_check</span>
                        Revisão das Questões
                    </h3>

                    {resultados.questoes.map((questao) => {
                        const config = classificacaoConfig[questao.classificacao];

                        return (
                            <div
                                key={questao.ordem}
                                className={`bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100 border-l-4 ${config.borderColor}`}
                            >
                                <div className="p-6">
                                    {/* Header */}
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex items-center gap-2">
                                            <span className={`${config.badgeBg} ${config.badgeText} text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1`}>
                                                <span className="material-symbols-outlined text-sm">{config.icon}</span>
                                                {config.label}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest bg-gray-50 px-2 py-0.5 rounded-full">
                                                {questao.banco === "GMAT" ? "GMAT" : "Business Case"}
                                            </span>
                                            <span className="text-xs text-gray-400 font-medium">Questão {questao.ordem}</span>
                                        </div>
                                    </div>

                                    {/* Enunciado */}
                                    <div 
                                        className="text-text-main font-medium mb-6 whitespace-pre-wrap leading-relaxed"
                                        dangerouslySetInnerHTML={{ __html: renderMathInHtml(questao.enunciado) }}
                                    />

                                    {/* Imagens caso existam */}
                                    {questao.imagens && questao.imagens.length > 0 && (
                                        <div className="mb-8 space-y-4">
                                            {questao.imagens.map((url: string, index: number) => (
                                                <div key={index} className="rounded-xl overflow-hidden border border-gray-200 bg-gray-50 flex flex-col items-center justify-center p-4">
                                                    <img src={url} alt={`Imagem ${index + 1} da questão`} className="max-w-full h-auto max-h-[300px] object-contain" />
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* Alternatives Summary */}
                                    <div className="space-y-3">
                                        {questao.alternativas?.map((alt, idx) => {
                                            const isSelected = questao.alternativaSelecionadaId === alt.id;
                                            const isCorrect = alt.correta;

                                            let altStyle = "border-gray-200 bg-gray-50 text-gray-500";
                                            if (isCorrect) {
                                                altStyle = "border-green-300 bg-green-50 text-green-800 font-medium ring-1 ring-green-300";
                                            } else if (isSelected && !isCorrect) {
                                                altStyle = "border-red-300 bg-red-50 text-red-800 font-medium line-through decoration-red-300/50";
                                            }

                                            return (
                                                <div 
                                                    key={alt.id} 
                                                    className={`flex items-start gap-4 p-4 rounded-xl border ${altStyle}`}
                                                >
                                                    <div className="pt-0.5 flex shrink-0 items-center justify-center">
                                                        {isCorrect ? (
                                                            <span className="material-symbols-outlined text-green-600 text-[20px]">check_circle</span>
                                                        ) : isSelected && !isCorrect ? (
                                                            <span className="material-symbols-outlined text-red-500 text-[20px]">cancel</span>
                                                        ) : (
                                                            <span className="w-5 h-5 rounded-full border border-gray-300 bg-white flex items-center justify-center text-[10px] font-bold text-gray-400">
                                                                {String.fromCharCode(65 + idx)}
                                                            </span>
                                                        )}
                                                    </div>
                                                    
                                                    <div 
                                                        className="text-sm leading-relaxed"
                                                        dangerouslySetInnerHTML={{ __html: renderMathInHtml(alt.texto) }}
                                                    />
                                                </div>
                                            );
                                        })}
                                        
                                        {!questao.respondida && (
                                            <p className="text-xs text-gray-500 italic mt-2 ml-1">
                                                Você não selecionou nenhuma alternativa para esta questão.
                                            </p>
                                        )}
                                    </div>
                                    
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col md:flex-row items-center justify-center gap-4 border-t border-gray-200 pt-10 pb-4">
                    <Link
                        href="/simulado"
                        className="w-full md:w-auto px-10 py-4 bg-[#FAD419] hover:bg-text-main hover:text-[#FAD419] text-text-main font-black rounded-xl transition-all shadow-lg shadow-[#FAD419]/20 flex items-center justify-center gap-2 group"
                    >
                        <span className="material-symbols-outlined group-hover:-translate-x-1 transition-transform">home</span>
                        Voltar ao Início
                    </Link>
                </div>
            </div>
        </div>
    );
}
