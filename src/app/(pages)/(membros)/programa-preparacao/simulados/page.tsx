"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSimulados } from "./context";
import { CustomAlert, AlertType } from "@/src/app/components/CustomAlert";

export default function SimuladosDashboardPage() {
    const { questoes, deleteQuestao } = useSimulados();

    // Filtros e Paginação
    const [searchTerm, setSearchTerm] = useState("");
    const [filterTipo, setFilterTipo] = useState("Todos");
    const [filterOrdem, setFilterOrdem] = useState("Mais Recentes");
    const [itemsPerPage, setItemsPerPage] = useState<number>(10);
    const [currentPage, setCurrentPage] = useState(1);

    const router = useRouter();

    // Custom Alert State
    const [alertConfig, setAlertConfig] = useState<{
        isOpen: boolean;
        type: AlertType;
        title: string;
        message: string;
        confirmText?: string;
        cancelText?: string;
        onConfirm: () => void;
        onCancel?: () => void;
    }>({
        isOpen: false,
        type: "success",
        title: "",
        message: "",
        onConfirm: () => { }
    });

    const closeAlert = () => setAlertConfig(prev => ({ ...prev, isOpen: false }));

    const handleCopyLink = () => {
        navigator.clipboard.writeText("https://simulados.ufrjconsulting.club");
        setAlertConfig({
            isOpen: true,
            type: "success",
            title: "Link Copiado!",
            message: "O link do simulado externo foi copiado para a área de transferência.",
            confirmText: "Entendi",
            onConfirm: closeAlert
        });
    };

    const handleAction = (action: string, id: number) => {
        if (action === "excluir") {
            setAlertConfig({
                isOpen: true,
                type: "warning",
                title: "Excluir Questão",
                message: "Tem certeza que deseja excluir esta questão? Essa ação não poderá ser desfeita.",
                confirmText: "Sim, Excluir",
                cancelText: "Cancelar",
                onConfirm: () => {
                    deleteQuestao(id);
                    // Ajustar paginação caso delete o último item da página atual
                    const totalPagesAfterDelete = Math.ceil((filteredQuestions.length - 1) / itemsPerPage);
                    if (currentPage > totalPagesAfterDelete && totalPagesAfterDelete > 0) {
                        setCurrentPage(totalPagesAfterDelete);
                    }
                    closeAlert();
                },
                onCancel: closeAlert
            });
        } else if (action === "editar") {
            router.push(`/programa-preparacao/simulados/criar?id=${id}`);
        } else {
            setAlertConfig({
                isOpen: true,
                type: "info",
                title: "Em Desenvolvimento",
                message: `Função de ${action} ainda em desenvolvimento para a questão ${id}!`,
                confirmText: "Voltar",
                onConfirm: closeAlert
            });
        }
    };

    // Filter and Sort Logic
    const filteredQuestions = useMemo(() => {
        let result = [...questoes];

        if (searchTerm.trim() !== "") {
            result = result.filter(q =>
                q.enunciado.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        if (filterTipo !== "Todos") {
            const isGMAT = filterTipo === "GMAT";
            result = result.filter(q => isGMAT ? q.banco === "GMAT" : q.banco === "Business Case");
        }

        if (filterOrdem === "Mais Recentes") {
            result.sort((a, b) => b.id - a.id); // Considerando ID maior como mais recente para mock
        } else {
            result.sort((a, b) => a.id - b.id);
        }

        return result;
    }, [questoes, searchTerm, filterTipo, filterOrdem]);

    // Pagination
    const totalPages = Math.ceil(filteredQuestions.length / itemsPerPage);
    const displayedQuestions = filteredQuestions.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const handlePageChange = (newPage: number) => {
        if (newPage >= 1 && newPage <= totalPages) {
            setCurrentPage(newPage);
        }
    };

    return (
        <div className="flex-1 overflow-y-auto bg-bg-main min-h-screen">
            <CustomAlert {...alertConfig} />
            {/* Header */}
            <header className="w-full px-8 py-6 bg-white border-b border-gray-200 sticky top-0 z-10">
                <div className="max-w-[1200px] mx-auto flex flex-col gap-4">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex flex-col gap-2">
                            <nav className="flex items-center gap-2 text-xs font-medium text-gray-500 uppercase tracking-widest">
                                <span>Dashboard</span>
                                <span className="material-symbols-outlined text-sm">chevron_right</span>
                                <span>Programa de Preparação</span>
                                <span className="material-symbols-outlined text-sm">chevron_right</span>
                                <span className="text-primary font-bold">Simulados</span>
                            </nav>
                            <h1 className="text-text-main text-3xl font-black leading-tight tracking-tight">
                                Simulados — Programa de Preparação
                            </h1>
                            <p className="text-text-muted text-sm font-normal max-w-2xl">
                                Gerencie o banco de questões de GMAT e Business Case e acompanhe o desempenho dos participantes.
                            </p>
                        </div>
                        <div className="flex items-center gap-4">
                            <Link
                                href="/programa-preparacao/simulados/criar"
                                className="bg-[#FAD419] hover:bg-[#FAD419]/90 text-text-main text-sm font-bold px-5 py-2.5 rounded-xl transition-all flex items-center gap-2 shadow-sm"
                            >
                                <span className="material-symbols-outlined text-lg">post_add</span>
                                Criar Questão
                            </Link>
                        </div>
                    </div>
                </div>
            </header>

            {/* Content */}
            <div className="p-8 pb-12">
                <div className="max-w-[1200px] mx-auto flex flex-col gap-8">

                    {/* Indicadores */}
                    <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <div className="bg-white p-6 rounded-xl shadow-sm border-b-4 border-[#FAD419] relative overflow-hidden">
                            <div className="flex justify-between items-start mb-4">
                                <span className="text-gray-500 font-semibold text-sm">Total de Questões</span>
                                <span className="material-symbols-outlined text-[#FAD419] bg-[#FAD419]/10 p-2 rounded-lg">database</span>
                            </div>
                            <p className="text-3xl font-black text-text-main">1,240</p>
                            <div className="mt-2 flex items-center text-xs font-bold text-green-500">
                                <span className="material-symbols-outlined text-sm">trending_up</span>
                                <span>+12% este mês</span>
                            </div>
                        </div>
                        <div className="bg-white p-6 rounded-xl shadow-sm border-b-4 border-[#FAD419] relative overflow-hidden">
                            <div className="flex justify-between items-start mb-4">
                                <span className="text-gray-500 font-semibold text-sm">Questões GMAT</span>
                                <span className="material-symbols-outlined text-[#FAD419] bg-[#FAD419]/10 p-2 rounded-lg">calculate</span>
                            </div>
                            <p className="text-3xl font-black text-text-main">850</p>
                            <p className="text-gray-400 text-xs mt-2 font-medium">68.5% do total do banco</p>
                        </div>
                        <div className="bg-white p-6 rounded-xl shadow-sm border-b-4 border-[#FAD419] relative overflow-hidden">
                            <div className="flex justify-between items-start mb-4">
                                <span className="text-gray-500 font-semibold text-sm">Questões Business Case</span>
                                <span className="material-symbols-outlined text-[#FAD419] bg-[#FAD419]/10 p-2 rounded-lg">business_center</span>
                            </div>
                            <p className="text-3xl font-black text-text-main">390</p>
                            <p className="text-gray-400 text-xs mt-2 font-medium">31.5% do total do banco</p>
                        </div>
                        <div className="bg-white p-6 rounded-xl shadow-sm border-b-4 border-[#FAD419] relative overflow-hidden">
                            <div className="flex justify-between items-start mb-4">
                                <span className="text-gray-500 font-semibold text-sm">Simulados Realizados</span>
                                <span className="material-symbols-outlined text-[#FAD419] bg-[#FAD419]/10 p-2 rounded-lg">assignment_turned_in</span>
                            </div>
                            <p className="text-3xl font-black text-text-main">156</p>
                            <div className="mt-2 flex items-center text-xs font-bold text-[#FAD419]">
                                <span>Média 14.2 por membro</span>
                            </div>
                        </div>
                    </section>

                    {/* Integração Externa */}
                    <section className="bg-[#FCE98C] p-6 rounded-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm border border-[#FAD419]/20">
                        <div className="flex items-center gap-4">
                            <div className="bg-[#FAD419]/20 p-3 rounded-full shrink-0">
                                <span className="material-symbols-outlined text-text-main">info</span>
                            </div>
                            <div>
                                <h4 className="font-bold text-lg text-text-main">Ambiente de Simulado Externo</h4>
                                <p className="text-gray-700 text-sm">
                                    Os simulados são realizados em ambiente controlado. Compartilhe o link de acesso com os participantes.
                                </p>
                            </div>
                        </div>
                        <button onClick={handleCopyLink} className="bg-[#FAD419] hover:bg-[#FAD419]/90 text-text-main px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all shadow-sm shrink-0 whitespace-nowrap cursor-pointer">
                            <span className="material-symbols-outlined text-xl">content_copy</span>
                            Copiar Link do Simulado
                        </button>
                    </section>

                    {/* Banco de Questões */}
                    <section className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        <div className="p-6 border-b border-gray-100 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                            <h3 className="text-xl font-black text-text-main">Banco de Questões</h3>
                            <div className="flex flex-wrap items-center gap-3">
                                <div className="relative">
                                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">search</span>
                                    <input
                                        type="text"
                                        placeholder="Buscar questão..."
                                        value={searchTerm}
                                        onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                                        className="pl-9 pr-3 py-2 bg-gray-50 border-gray-200 rounded-lg text-sm w-full md:w-48 focus:ring-[#FAD419] focus:border-[#FAD419] transition-all"
                                    />
                                </div>
                                <select
                                    value={filterTipo}
                                    onChange={(e) => { setFilterTipo(e.target.value); setCurrentPage(1); }}
                                    className="bg-gray-50 border-gray-200 text-sm rounded-lg py-2 px-3 focus:ring-[#FAD419] focus:border-[#FAD419] text-gray-600"
                                >
                                    <option value="Todos">Tipo: Todos</option>
                                    <option value="GMAT">GMAT</option>
                                    <option value="Business Case">Business Case</option>
                                </select>
                                <select
                                    value={filterOrdem}
                                    onChange={(e) => { setFilterOrdem(e.target.value); setCurrentPage(1); }}
                                    className="bg-gray-50 border-gray-200 text-sm rounded-lg py-2 px-3 focus:ring-[#FAD419] focus:border-[#FAD419] text-gray-600"
                                >
                                    <option value="Mais Recentes">Data: Mais Recentes</option>
                                    <option value="Mais Antigos">Mais Antigos</option>
                                </select>
                            </div>
                        </div>
                        <div className="overflow-x-auto min-h-[300px]">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-gray-50 text-gray-500 uppercase text-[10px] font-bold tracking-widest border-b border-gray-200">
                                    <tr>
                                        <th className="px-6 py-4">Enunciado</th>
                                        <th className="px-6 py-4 whitespace-nowrap">Tipo</th>
                                        <th className="px-6 py-4 whitespace-nowrap">Banco</th>
                                        <th className="px-6 py-4 whitespace-nowrap">Data de Criação</th>
                                        <th className="px-6 py-4 text-right">Ações</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 text-sm">
                                    {displayedQuestions.map((q) => (
                                        <tr key={q.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4">
                                                <p className="font-bold text-text-main line-clamp-2 md:max-w-md w-full leading-relaxed">
                                                    {q.enunciado}
                                                </p>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-xs font-bold uppercase whitespace-nowrap">
                                                    {q.tipo}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-3 py-1 rounded-lg text-xs font-bold whitespace-nowrap ${q.colorBanco === "blue" ? "bg-blue-50 border border-blue-100 text-blue-700" : "bg-purple-50 border border-purple-100 text-purple-700"
                                                    }`}>
                                                    {q.banco}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-gray-500 whitespace-nowrap">{q.data}</td>
                                            <td className="px-6 py-4 text-right space-x-2 whitespace-nowrap">
                                                <button onClick={() => handleAction("editar", q.id)} className="p-2 hover:bg-[#FAD419]/20 rounded-lg text-gray-400 hover:text-[#FAD419] cursor-pointer transition-all">
                                                    <span className="material-symbols-outlined text-lg">edit</span>
                                                </button>
                                                <button onClick={() => handleAction("excluir", q.id)} className="p-2 hover:bg-red-50 rounded-lg text-gray-400 hover:text-red-500 cursor-pointer transition-all">
                                                    <span className="material-symbols-outlined text-lg">delete</span>
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                    {displayedQuestions.length === 0 && (
                                        <tr>
                                            <td colSpan={5} className="px-6 py-12 text-center text-gray-500 font-medium">
                                                Nenhuma questão encontrada com esses filtros.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination Area */}
                        <div className="p-4 bg-gray-50 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                            <div className="flex items-center gap-2 text-sm text-gray-500">
                                <span>Mostrar:</span>
                                <select
                                    value={itemsPerPage}
                                    onChange={(e) => {
                                        setItemsPerPage(Number(e.target.value));
                                        setCurrentPage(1);
                                    }}
                                    className="bg-white border-gray-200 text-sm rounded-lg py-1 px-2 focus:ring-[#FAD419] focus:border-[#FAD419] text-gray-700"
                                >
                                    <option value={10}>10</option>
                                    <option value={20}>20</option>
                                    <option value={50}>50</option>
                                </select>
                                <span>questões por página</span>
                            </div>

                            <div className="flex items-center justify-center gap-2">
                                <button
                                    onClick={() => handlePageChange(currentPage - 1)}
                                    disabled={currentPage === 1}
                                    className="p-1 px-2 rounded hover:bg-white border border-transparent disabled:opacity-50 disabled:hover:bg-transparent transition-colors flex items-center gap-1 text-sm font-medium text-gray-600"
                                >
                                    <span className="material-symbols-outlined text-[16px]">chevron_left</span>
                                    Anterior
                                </button>

                                <span className="text-sm font-bold text-gray-700 mx-2">
                                    Página {currentPage} de {totalPages || 1}
                                </span>

                                <button
                                    onClick={() => handlePageChange(currentPage + 1)}
                                    disabled={currentPage === totalPages || totalPages === 0}
                                    className="p-1 px-2 rounded hover:bg-white border border-transparent disabled:opacity-50 disabled:hover:bg-transparent transition-colors flex items-center gap-1 text-sm font-medium text-gray-600"
                                >
                                    Próxima
                                    <span className="material-symbols-outlined text-[16px]">chevron_right</span>
                                </button>
                            </div>
                        </div>
                    </section>

                    {/* Últimas Atividades */}
                    <section className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                            <h3 className="text-xl font-black text-text-main">Últimas Atividades de Simulados</h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-gray-50 text-gray-500 uppercase text-[10px] font-bold tracking-widest border-b border-gray-200">
                                    <tr>
                                        <th className="px-6 py-4">Participante</th>
                                        <th className="px-6 py-4 whitespace-nowrap">Tipo Simulado</th>
                                        <th className="px-6 py-4 whitespace-nowrap">Qtd. Questões</th>
                                        <th className="px-6 py-4 whitespace-nowrap">Acertos</th>
                                        <th className="px-6 py-4 whitespace-nowrap">Tempo Rest.</th>
                                        <th className="px-6 py-4 whitespace-nowrap">Status</th>
                                        <th className="px-6 py-4 whitespace-nowrap">Data</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 text-sm">
                                    <tr className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="font-bold text-text-main whitespace-nowrap">Lucas Almeida</span>
                                                <span className="text-xs text-gray-500">lucas.almeida@ufrj.br</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 font-medium text-gray-700 whitespace-nowrap">GMAT Full Test</td>
                                        <td className="px-6 py-4 text-center">31</td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <span className="font-bold text-green-600">28</span>
                                                <span className="text-xs text-gray-400">(90.3%)</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-gray-500">12m 45s</td>
                                        <td className="px-6 py-4">
                                            <span className="bg-[#FCE98C] text-text-main px-3 py-1 rounded-full text-[10px] font-black uppercase whitespace-nowrap">
                                                Membro
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-gray-500 whitespace-nowrap">Hoje, 14:20</td>
                                    </tr>
                                    <tr className="hover:bg-gray-50 transition-colors bg-[#FCE98C]/10">
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="font-bold text-text-main whitespace-nowrap">Fernanda Costa</span>
                                                <span className="text-xs text-gray-500">f.costa@poli.ufrj.br</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 font-medium text-gray-700 whitespace-nowrap">Business Logic I</td>
                                        <td className="px-6 py-4 text-center">15</td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <span className="font-bold text-text-main">12</span>
                                                <span className="text-xs text-gray-400">(80%)</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-gray-500">02m 10s</td>
                                        <td className="px-6 py-4">
                                            <span className="bg-gray-800 text-white shadow-sm px-3 py-1 rounded-full text-[10px] font-black uppercase whitespace-nowrap">
                                                Externo
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-gray-500 whitespace-nowrap">Ontem, 18:45</td>
                                    </tr>
                                    <tr className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="font-bold text-text-main whitespace-nowrap">Rodrigo Mendes</span>
                                                <span className="text-xs text-gray-500">rodrigo.m@ufrj.br</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 font-medium text-gray-700 whitespace-nowrap">GMAT Quant Diagnostic</td>
                                        <td className="px-6 py-4 text-center">10</td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <span className="font-bold text-red-600">4</span>
                                                <span className="text-xs text-gray-400">(40%)</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-gray-500">00m 00s</td>
                                        <td className="px-6 py-4">
                                            <span className="bg-gray-200 text-gray-600 px-3 py-1 rounded-full text-[10px] font-black uppercase whitespace-nowrap">
                                                Ex-membro
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-gray-500 whitespace-nowrap">12 Out 2023</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </section>

                </div>
            </div>
        </div>
    )
}
