"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { ChevronRight } from "lucide-react";
import dynamic from "next/dynamic";
import DataTable from "react-data-table-component";
import { getResultadosSimulado, getSessaoSimulado } from "@/src/actions/simuladosActions";

const ReactApexChart = dynamic(() => import("react-apexcharts"), { ssr: false });

function formatTime(seconds: number) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}m ${s.toString().padStart(2, '0')}s`;
}

export default function SessaoSimuladoDetalhesPage() {
    const router = useRouter();
    const params = useParams();
    const [loading, setLoading] = useState(true);
    const [resultados, setResultados] = useState<any>(null);
    const [sessaoPendente, setSessaoPendente] = useState<any>(null);

    useEffect(() => {
        (async () => {
            setLoading(true);
            try {
                const id = Number(params.id);
                // First try to load as finalized
                const res = await getResultadosSimulado(id);
                if (res) {
                    setResultados(res);
                } else {
                    // Try to load as pending
                    const s = await getSessaoSimulado(id);
                    setSessaoPendente(s);
                }
            } catch (err) {
                console.error("Erro ao carregar sessão:", err);
            } finally {
                setLoading(false);
            }
        })();
    }, [params.id]);

    if (loading) {
        return (
            <div className="flex-1 bg-bg-main min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#FAD419]"></div>
            </div>
        );
    }

    if (!resultados && !sessaoPendente) {
        return (
            <div className="flex-1 bg-bg-main min-h-screen p-8 text-center flex flex-col items-center justify-center">
                <span className="material-symbols-outlined text-6xl text-gray-300 mb-4">error</span>
                <h2 className="text-2xl font-bold text-gray-700">Sessão não encontrada</h2>
                <button onClick={() => router.push("/coord/programa-preparacao/simulados")} className="mt-6 text-[#FAD419] font-bold hover:underline">Voltar para Simulados</button>
            </div>
        );
    }

    if (sessaoPendente && sessaoPendente.status !== "FINALIZADO") {
        return (
            <div className="flex-1 bg-bg-main min-h-screen">
                <header className="w-full px-8 py-6 bg-white border-b border-gray-200">
                    <nav className="flex items-center gap-2 text-sm font-medium text-gray-400 mb-6 uppercase tracking-widest">
                        <Link href="/coord/home" className="hover:text-[#FAD419] transition-colors">Dashboard</Link>
                        <ChevronRight size={14} />
                        <Link href="/coord/programa-preparacao/simulados" className="hover:text-[#FAD419] transition-colors">Simulados</Link>
                        <ChevronRight size={14} />
                        <span className="text-text-main font-bold">Resumo da Sessão</span>
                    </nav>
                    <h2 className="text-3xl font-black text-text-main tracking-tight">Sessão Em Andamento</h2>
                </header>
                <div className="p-8 pb-12">
                    <div className="max-w-[1200px] mx-auto bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center flex flex-col items-center justify-center">
                        <div className="w-16 h-16 bg-[#FCE98C]/50 rounded-full flex items-center justify-center mb-4">
                            <span className="material-symbols-outlined text-3xl text-[#FAD419]">hourglass_top</span>
                        </div>
                        <h3 className="text-xl font-bold text-gray-800">Sessão ainda não foi finalizada</h3>
                        <p className="text-gray-500 mt-2">O participante {sessaoPendente.nomeUsuario} ainda não concluiu este simulado.</p>
                        <p className="text-gray-400 text-sm mt-1">Tempo restante: {formatTime(sessaoPendente.tempoRestanteSegundos)}</p>
                        <Link href="/coord/programa-preparacao/simulados" className="mt-8 px-6 py-2.5 bg-gray-100 text-gray-600 rounded-lg font-bold hover:bg-gray-200 transition-colors">Voltar</Link>
                    </div>
                </div>
            </div>
        );
    }

    const res = resultados!;
    const chartSeries = [res.acertos, res.erros, res.naoRespondidas];
    const chartOptions: ApexCharts.ApexOptions = {
        labels: ['Acertos', 'Erros', 'Não Respondidas'],
        colors: ['#22c55e', '#ef4444', '#cbd5e1'],
        chart: { type: 'donut' },
        dataLabels: { enabled: true, formatter: (val) => `${Number(val).toFixed(0)}%` },
        plotOptions: {
            pie: {
                donut: {
                    size: '65%',
                    labels: {
                        show: true,
                        name: { show: true },
                        value: { show: true, fontSize: '24px', fontWeight: 'bold' },
                        total: { show: true, label: 'Questões', color: '#64748b' }
                    }
                }
            }
        },
        legend: { position: 'bottom' }
    };

    const columns = [
        {
            name: "Ordem",
            selector: (row: any) => row.ordem,
            sortable: true,
            width: "80px",
            center: true
        },
        {
            name: "Enunciado da Questão",
            selector: (row: any) => row.enunciado,
            sortable: true,
            wrap: true,
            format: (row: any) => <div className="py-2"><span className="line-clamp-2 md:max-w-md" title={row.enunciado}>{row.enunciado}</span></div>
        },
        {
            name: "Dificuldade",
            selector: (row: any) => row.dificuldade || "N/A",
            sortable: true,
            width: "120px"
        },
        {
            name: "Resultado",
            selector: (row: any) => row.classificacao,
            sortable: true,
            width: "160px",
            cell: (row: any) => {
                if (row.classificacao === "CORRETA") return <span className="px-3 py-1 bg-green-50 text-green-700 rounded-md font-bold text-[10px] uppercase">Correta</span>;
                if (row.classificacao === "INCORRETA") return <span className="px-3 py-1 bg-red-50 text-red-700 rounded-md font-bold text-[10px] uppercase">Incorreta</span>;
                return <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-md font-bold text-[10px] uppercase">Não Resp.</span>;
            }
        }
    ];

    const questoes = res.questoes;
    const tempoGasto = res.tempoTotalSegundos - res.tempoRestanteSegundos;

    return (
        <div className="flex-1 overflow-y-auto bg-bg-main min-h-screen">
            <header className="w-full px-8 py-6 bg-white border-b border-gray-200 sticky top-0 z-10">
                <div className="max-w-[1200px] mx-auto flex flex-col gap-4">
                    <nav className="flex items-center gap-2 text-xs font-medium text-gray-500 uppercase tracking-widest">
                        <Link href="/coord/home" className="hover:text-primary transition-colors">Dashboard</Link>
                        <ChevronRight size={14} className="text-text-muted" />
                        <Link href="/coord/programa-preparacao/simulados" className="hover:text-primary transition-colors">Simulados</Link>
                        <ChevronRight size={14} className="text-text-muted" />
                        <span className="text-primary font-bold">Detalhes da Sessão</span>
                    </nav>
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <h1 className="text-text-main text-3xl font-black leading-tight tracking-tight mt-1">
                                Resultado de {res.nomeUsuario}
                            </h1>
                            <p className="text-text-muted text-sm font-normal mt-1">{res.emailUsuario}</p>
                        </div>
                    </div>
                </div>
            </header>

            <div className="p-8 pb-12">
                <div className="max-w-[1200px] mx-auto flex flex-col gap-8">
                    {/* Metrics */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col">
                            <span className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-2">Simulado</span>
                            <span className="text-2xl font-black text-text-main">{res.tipoSimulado}</span>
                            <span className="text-sm text-gray-400 mt-1">Dificuldade: {res.dificuldade || "Mista"}</span>
                        </div>
                        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col">
                            <span className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-2">Aproveitamento</span>
                            <span className={`text-3xl font-black ${res.percentualAcerto > 70 ? 'text-green-500' : res.percentualAcerto > 40 ? 'text-yellow-500' : 'text-red-500'}`}>{res.percentualAcerto}%</span>
                            <span className="text-sm text-gray-400 mt-1">{res.acertos} de {res.totalQuestoes} corretas</span>
                        </div>
                        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col">
                            <span className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-2">Tempo Gasto</span>
                            <span className="text-3xl font-black text-gray-700">{formatTime(tempoGasto)}</span>
                            <span className="text-sm text-gray-400 mt-1">De um total de {formatTime(res.tempoTotalSegundos)}</span>
                        </div>
                        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col">
                            <span className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-2">Conclusão</span>
                            <span className="text-lg font-bold text-gray-700 mt-1">
                                {res.finalizadoEm ? new Date(res.finalizadoEm).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'N/A'}
                            </span>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Chart */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col items-center justify-center">
                            <h3 className="w-full text-left font-bold text-gray-700 mb-4">Desempenho Visual</h3>
                            <ReactApexChart options={chartOptions} series={chartSeries} type="donut" height={320} width="100%" />
                        </div>

                        {/* Table */}
                        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                                <h3 className="font-bold text-gray-700">Respostas por Questão</h3>
                            </div>
                            <div className="p-2">
                                <DataTable
                                    columns={columns}
                                    data={questoes}
                                    pagination
                                    paginationPerPage={10}
                                    paginationRowsPerPageOptions={[10, 20]}
                                    noDataComponent={<p className="p-4 text-gray-500">Nenhuma questão encontrada.</p>}
                                    customStyles={{
                                        headRow: { style: { backgroundColor: '#f9fafb', fontWeight: 'bold', color: '#6b7280', fontSize: '11px', textTransform: 'uppercase' } },
                                        rows: { style: { minHeight: '60px', '&:hover': { backgroundColor: '#fafafa' } } }
                                    }}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
