"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Search, ArrowLeft } from "lucide-react"
import { CandidatoRow } from "./CandidatoRow"
import { CandidatoDrawer } from "./CandidatoDrawer"
import { 
    getCandidatosDetalhados, 
    getProcessoSeletivoInfo
} from "@/src/actions/gestaoCandidatosActions"
import { CandidatoDetalhado, StatusCandidato } from "@/src/types/candidatos"

interface CandidatosProcessoContentProps {
    processoId: number
}

type FiltroStatus = "todos" | StatusCandidato
type FiltroEtapa = "todas" | "1" | "2" | "3" | "4"
type OrdemOpcao = "nome" | "etapa"

export function CandidatosProcessoContent({ processoId }: CandidatosProcessoContentProps) {
    const router = useRouter()
    const [candidatos, setCandidatos] = useState<CandidatoDetalhado[]>([])
    const [processoInfo, setProcessoInfo] = useState<{ nome: string; ativo: boolean } | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [drawerCandidato, setDrawerCandidato] = useState<CandidatoDetalhado | null>(null)
    
    // Filtros
    const [busca, setBusca] = useState("")
    const [filtroStatus, setFiltroStatus] = useState<FiltroStatus>("todos")
    const [filtroEtapa, setFiltroEtapa] = useState<FiltroEtapa>("todas")
    const [filtroCurso, setFiltroCurso] = useState("")
    const [ordem, setOrdem] = useState<OrdemOpcao>("nome")
    
    const loadData = useCallback(async () => {
        setIsLoading(true)
        const [candidatosData, processoData] = await Promise.all([
            getCandidatosDetalhados(processoId),
            getProcessoSeletivoInfo(processoId)
        ])
        setCandidatos(candidatosData)
        setProcessoInfo(processoData)
        setIsLoading(false)
    }, [processoId])

    useEffect(() => {
        loadData()
    }, [loadData])
    
    // Filtrar candidatos
    const candidatosFiltrados = candidatos.filter(c => {
        // Busca por nome
        if (busca && !c.nome.toLowerCase().includes(busca.toLowerCase())) {
            return false
        }
        
        // Filtro de status
        if (filtroStatus !== "todos" && c.statusGeral !== filtroStatus) {
            return false
        }
        
        // Filtro de etapa atual
        if (filtroEtapa !== "todas" && c.etapaAtual !== parseInt(filtroEtapa)) {
            return false
        }
        
        // Filtro de curso
        if (filtroCurso && c.curso !== filtroCurso) {
            return false
        }
        
        return true
    })
    
    // Ordenar candidatos
    const candidatosOrdenados = [...candidatosFiltrados].sort((a, b) => {
        if (ordem === "etapa") {
            return b.etapaAtual - a.etapaAtual
        }
        return a.nome.localeCompare(b.nome)
    })
    
    // Lista de cursos únicos para filtro
    const cursosUnicos = [...new Set(candidatos.map(c => c.curso).filter(Boolean))]
    
    return (
        <div className="flex-1 overflow-y-auto">
            {/* Header */}
            <div className="bg-bg-main border-b border-border">
                <div className="px-8 py-6 max-w-[1600px] mx-auto w-full flex flex-col gap-6">
                    {/* Breadcrumbs */}
                    <div className="flex flex-wrap items-center gap-2 text-sm">
                        <Link href="/coord/processo-seletivo/candidatos" className="text-text-muted hover:text-primary transition-colors flex items-center gap-1">
                            <span className="material-symbols-outlined text-sm">home</span>
                            Processo Seletivo
                        </Link>
                        <span className="material-symbols-outlined text-text-muted text-sm">chevron_right</span>
                        <span className="text-text-main font-semibold">{processoInfo?.nome || "Carregando..."}</span>
                    </div>

                    {/* Title & Actions */}
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                        <div className="flex flex-col gap-2">
                            <div className="flex items-center gap-3">
                                <button 
                                    onClick={() => router.back()}
                                    className="p-2 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                                >
                                    <ArrowLeft size={20} className="text-text-muted" />
                                </button>
                                <h1 className="text-text-main text-3xl md:text-4xl font-black leading-tight tracking-[-0.033em]">
                                    Gerenciamento de Candidatos
                                </h1>
                            </div>
                            <p className="text-text-muted text-base font-normal ml-11">
                                Gerencie as etapas e avaliações dos candidatos inscritos no {processoInfo?.nome || "processo seletivo"}.
                            </p>
                        </div>
                        <div className="flex items-center gap-2">
                            {processoInfo?.ativo && (
                                <span className="bg-green-100 text-green-800 text-xs font-bold px-2.5 py-1 rounded border border-green-200">
                                    Processo Ativo
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            </div>
            
            {/* Filters */}
            <div className="bg-white border-b border-border">
                <div className="px-8 py-4 max-w-[1600px] mx-auto w-full">
                    <div className="flex flex-col xl:flex-row gap-4 items-end">
                        <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-5 gap-3 flex-1 w-full">
                            {/* Status */}
                            <FilterSelect
                                label="Status"
                                value={filtroStatus}
                                onChange={(v) => setFiltroStatus(v as FiltroStatus)}
                                options={[
                                    { value: "todos", label: "Todos" },
                                    { value: "ATIVO", label: "Ativo" },
                                    { value: "APROVADO", label: "Aprovado" },
                                    { value: "REPROVADO", label: "Reprovado" },
                                    { value: "DESISTENTE", label: "Desistente" }
                                ]}
                            />
                            
                            {/* Etapa */}
                            <FilterSelect
                                label="Etapa Atual"
                                value={filtroEtapa}
                                onChange={(v) => setFiltroEtapa(v as FiltroEtapa)}
                                options={[
                                    { value: "todas", label: "Todas" },
                                    { value: "1", label: "1. Prova" },
                                    { value: "2", label: "2. Dinâmica" },
                                    { value: "3", label: "3. Entrevista" },
                                    { value: "4", label: "4. Capacitação" }
                                ]}
                            />
                            
                            {/* Curso */}
                            <FilterSelect
                                label="Curso"
                                value={filtroCurso}
                                onChange={setFiltroCurso}
                                options={[
                                    { value: "", label: "Todos" },
                                    ...cursosUnicos.map(c => ({ value: c!, label: c! }))
                                ]}
                            />
                            
                            {/* Ordenar */}
                            <FilterSelect
                                label="Ordenar por"
                                value={ordem}
                                onChange={(v) => setOrdem(v as OrdemOpcao)}
                                options={[
                                    { value: "nome", label: "Nome" },
                                    { value: "etapa", label: "Etapa mais avançada" }
                                ]}
                                icon="sort"
                            />
                        </div>
                        
                        {/* Search */}
                        <div className="w-full xl:w-auto min-w-[280px]">
                            <div className="relative">
                                <input
                                    type="text"
                                    value={busca}
                                    onChange={(e) => setBusca(e.target.value)}
                                    placeholder="Buscar candidato..."
                                    className="w-full rounded-lg border border-border bg-gray-50 pl-10 pr-4 py-2.5 text-sm text-text-main focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 placeholder:text-text-muted"
                                />
                                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            {/* Content */}
            <div className="px-8 pb-8 pt-6">
                <div className="max-w-[1600px] mx-auto w-full flex flex-col gap-4">
                    {/* Table Header */}
                    <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-3 text-xs font-bold text-text-muted uppercase tracking-wider border-b border-border bg-white rounded-lg shadow-sm">
                        <div className="col-span-3">Candidato</div>
                        <div className="col-span-2 text-center">1. Prova</div>
                        <div className="col-span-2 text-center">2. Dinâmica</div>
                        <div className="col-span-2 text-center">3. Entrevista</div>
                        <div className="col-span-1 text-center">4. Capacitação</div>
                        <div className="col-span-2 text-right">Ações</div>
                    </div>
                    
                    {/* Candidates List */}
                    {isLoading ? (
                        <div className="py-12 text-center text-text-muted">Carregando candidatos...</div>
                    ) : candidatosOrdenados.length === 0 ? (
                        <div className="py-12 text-center">
                            <p className="text-lg font-medium text-text-main">Nenhum candidato encontrado</p>
                            <p className="text-sm text-text-muted mt-2">
                                {busca || filtroStatus !== "todos" || filtroEtapa !== "todas" || filtroCurso
                                    ? "Tente ajustar os filtros de busca"
                                    : "Não há candidatos inscritos neste processo seletivo"}
                            </p>
                        </div>
                    ) : (
                        <>
                            {candidatosOrdenados.map(candidato => (
                                <CandidatoRow 
                                    key={candidato.id}
                                    candidato={candidato}
                                    onViewDetails={setDrawerCandidato}
                                />
                            ))}
                            
                            {/* Stats Footer */}
                            <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
                                <p className="text-sm text-text-muted">
                                    Mostrando <span className="font-bold text-text-main">{candidatosOrdenados.length}</span> de <span className="font-bold text-text-main">{candidatos.length}</span> candidatos
                                </p>
                            </div>
                        </>
                    )}
                </div>
            </div>
            
            {/* Drawer */}
            <CandidatoDrawer 
                candidato={drawerCandidato}
                isOpen={!!drawerCandidato}
                onClose={() => setDrawerCandidato(null)}
                onCandidatoAtualizado={loadData}
            />
        </div>
    )
}

// Helper component for filter selects
function FilterSelect({ 
    label, 
    value, 
    onChange, 
    options,
    icon = "expand_more"
}: { 
    label: string
    value: string
    onChange: (value: string) => void
    options: { value: string; label: string }[]
    icon?: string
}) {
    return (
        <label className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-text-main">{label}</span>
            <div className="relative">
                <select
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    className="w-full appearance-none rounded-lg border border-border bg-gray-50 px-3 py-2.5 text-sm text-text-main focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-shadow cursor-pointer"
                >
                    {options.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                </select>
                <span className="material-symbols-outlined absolute right-2 top-2.5 pointer-events-none text-text-muted" style={{ fontSize: "20px" }}>
                    {icon}
                </span>
            </div>
        </label>
    )
}
