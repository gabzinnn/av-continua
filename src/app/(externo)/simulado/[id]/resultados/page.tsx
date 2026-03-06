import Link from "next/link";
import { getResultadosSimulado, type ClassificacaoResposta } from "@/src/actions/simuladosActions";
import { redirect } from "next/navigation";

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
    PROVAVEL_ACERTO: {
        label: "PROVÁVEL ACERTO",
        icon: "check_circle",
        badgeBg: "bg-green-100",
        badgeText: "text-green-700",
        borderColor: "border-l-green-500",
        userBoxBg: "bg-green-50/50",
        userBoxBorder: "border-green-100",
        userBoxLabel: "text-green-600",
        userBoxText: "text-green-800",
    },
    PARCIAL: {
        label: "PARCIALMENTE CORRETA",
        icon: "help",
        badgeBg: "bg-amber-100",
        badgeText: "text-amber-700",
        borderColor: "border-l-amber-400",
        userBoxBg: "bg-amber-50/50",
        userBoxBorder: "border-amber-100",
        userBoxLabel: "text-amber-600",
        userBoxText: "text-amber-800",
    },
    PROVAVEL_ERRO: {
        label: "PROVÁVEL ERRO",
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
    SEM_GABARITO: {
        label: "SEM GABARITO",
        icon: "info",
        badgeBg: "bg-blue-100",
        badgeText: "text-blue-700",
        borderColor: "border-l-blue-400",
        userBoxBg: "bg-blue-50/50",
        userBoxBorder: "border-blue-100",
        userBoxLabel: "text-blue-600",
        userBoxText: "text-blue-800",
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
                            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">Questões Respondidas</p>
                            <p className="text-4xl font-black text-text-main">
                                {resultados.respondidas}
                                <span className="text-gray-400 text-2xl font-normal">/{resultados.totalQuestoes}</span>
                            </p>
                        </div>
                        <div className="w-16 h-16 rounded-full border-4 border-[#FAD419] flex items-center justify-center">
                            <span className="text-xl font-black text-[#FAD419]">{resultados.percentualRespondidas}%</span>
                        </div>
                    </div>
                </section>

                {/* Stats Row */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <div className="bg-white rounded-2xl border border-gray-100 p-4 text-center">
                        <span className="material-symbols-outlined text-green-500 text-2xl mb-1">check_circle</span>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Prováveis Acertos</p>
                        <p className="text-xl font-black text-green-600">{resultados.provaveisAcertos}</p>
                    </div>
                    <div className="bg-white rounded-2xl border border-gray-100 p-4 text-center">
                        <span className="material-symbols-outlined text-amber-500 text-2xl mb-1">help</span>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Parciais</p>
                        <p className="text-xl font-black text-amber-600">{resultados.parciais}</p>
                    </div>
                    <div className="bg-white rounded-2xl border border-gray-100 p-4 text-center">
                        <span className="material-symbols-outlined text-red-500 text-2xl mb-1">cancel</span>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Prováveis Erros</p>
                        <p className="text-xl font-black text-red-500">{resultados.provaveisErros}</p>
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

                {/* Disclaimer */}
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
                    <span className="material-symbols-outlined text-amber-500 mt-0.5">info</span>
                    <p className="text-sm text-amber-800">
                        <strong>Nota:</strong> A classificação (provável acerto/parcial/erro) é estimada por um algoritmo de similaridade textual.
                        Por ser um simulado discursivo, a avaliação final depende de análise qualitativa.
                    </p>
                </div>

                {/* Questions Review */}
                <div className="space-y-6">
                    <h3 className="text-xl font-black flex items-center gap-2 px-2 text-text-main">
                        <span className="material-symbols-outlined">fact_check</span>
                        Revisão das Questões
                    </h3>

                    {resultados.questoes.map((questao) => {
                        const config = classificacaoConfig[questao.classificacao];
                        const temRespostaModelo = !!questao.respostaModelo?.trim();

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
                                            {questao.similaridade >= 0 && (
                                                <span className="text-[10px] font-bold text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full">
                                                    {questao.similaridade}% similar
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest bg-gray-50 px-2 py-0.5 rounded-full">
                                                {questao.banco === "GMAT" ? "GMAT" : "Business Case"}
                                            </span>
                                            <span className="text-xs text-gray-400 font-medium">Questão {questao.ordem}</span>
                                        </div>
                                    </div>

                                    {/* Enunciado */}
                                    <p className="text-text-main font-medium mb-6 whitespace-pre-wrap leading-relaxed">{questao.enunciado}</p>

                                    {/* Responses Grid */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {/* User Response */}
                                        <div className={`p-4 rounded-xl border ${config.userBoxBg} ${config.userBoxBorder}`}>
                                            <p className={`text-[10px] font-bold uppercase mb-2 tracking-widest ${config.userBoxLabel}`}>
                                                Sua Resposta
                                            </p>
                                            <p className={`text-sm leading-relaxed whitespace-pre-wrap ${
                                                questao.respondida ? config.userBoxText : 'text-gray-400 italic'
                                            }`}>
                                                {questao.respostaUsuario || "Nenhuma resposta fornecida."}
                                            </p>
                                        </div>

                                        {/* Model Response */}
                                        {temRespostaModelo && (
                                            <div className="p-4 rounded-xl bg-gray-50 border border-gray-200">
                                                <p className="text-[10px] font-bold uppercase text-gray-500 mb-2 tracking-widest">
                                                    Resposta Modelo
                                                </p>
                                                <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                                                    {questao.respostaModelo}
                                                </p>
                                            </div>
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
                    <Link
                        href="/simulado"
                        className="w-full md:w-auto px-10 py-4 bg-white border border-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-50 transition-all flex items-center justify-center gap-2"
                    >
                        <span className="material-symbols-outlined">add</span>
                        Novo Simulado
                    </Link>
                </div>
            </div>
        </div>
    );
}
