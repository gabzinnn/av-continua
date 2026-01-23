"use client"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import dynamic from "next/dynamic"
import Image from "next/image"
import { ArrowLeft, Download, FileText, TrendingUp, Users, BarChart3, Activity } from "lucide-react"
import { Button } from "@/src/app/components/Button"
import { Card } from "@/src/app/components/Card"
import { RelatorioCiclo, MembroRelatorio } from "@/src/actions/relatorioActions"
import html2canvas from "html2canvas"
import { jsPDF } from "jspdf"

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false })

interface RelatorioContentProps {
    relatorio: RelatorioCiclo
    cicloId: number
}

function formatNumber(num: number): string {
    return num.toFixed(1)
}

function getChartMinMax(dataPoints: number[]) {
    if (dataPoints.length === 0) return { min: 0, max: 10 };
    const minVal = Math.min(...dataPoints);
    const maxVal = Math.max(...dataPoints);
    const min = Math.max(0, Math.floor(minVal * 2) / 2 - 0.5); 
    const max = Math.min(10, Math.ceil(maxVal * 2) / 2 + 0.5);
    return { min, max };
}

// Cores para gráficos e UI
const COLORS = {
    primary: "#fad419",
    primaryLight: "#fff9d1", // ~primary/10
    greenText: "#16a34a",
    greenBg: "#dcfce7",
    yellowText: "#ca8a04",
    yellowBg: "#fef9c3",
    redText: "#dc2626",
    redBg: "#fee2e2",
    textMain: "#1c1a0d",
    textMuted: "#9e9047",
    border: "#e9e4ce",
    bgMain: "#f8f8f5",
    bgWhite: "#ffffff"
}

function getNotaStyle(nota: number) {
    if (nota >= 8) return { color: "#2563eb", backgroundColor: "#dbeafe" }
    if (nota > 6) return { color: COLORS.greenText, backgroundColor: COLORS.greenBg }
    if (nota >= 4) return { color: COLORS.yellowText, backgroundColor: COLORS.yellowBg }
    return { color: COLORS.redText, backgroundColor: COLORS.redBg }
}

// Componente de Card Individual do Membro
function MembroCardRelatorio({ membro }: { membro: MembroRelatorio }) {
    // Calcular min/max para o gráfico do membro
    const allValues = [
        ...membro.historico.map(h => h.mediaEntrega),
        ...membro.historico.map(h => h.mediaCultura),
        ...membro.historico.map(h => h.mediaFeedback)
    ];
    const { min, max } = getChartMinMax(allValues);

    const options: ApexCharts.ApexOptions = {
        chart: {
            type: "line",
            toolbar: { show: false },
            fontFamily: "inherit",
            zoom: { enabled: false }
        },
        colors: ["#f9d41a", "#4ade80", "#60a5fa"],
        stroke: {
            curve: "smooth",
            width: 3,
        },
        markers: {
            size: 5,
        },
        xaxis: {
            categories: membro.historico.map(h => h.avaliacao),
            labels: {
                style: { fontSize: "10px" },
            },
        },
        yaxis: {
            min,
            max,
            tickAmount: 5,
            labels: {
                formatter: (val) => val.toFixed(1),
            },
        },
        legend: {
            position: "top",
        },
        tooltip: {
            y: {
                formatter: (val) => val.toFixed(2),
            },
        },
        grid: {
            padding: {
                top: 0,
                right: 0,
                bottom: 0,
                left: 10
            }
        }
    }

    const series = [
        {
            name: "Entrega",
            data: membro.historico.map(h => Number(h.mediaEntrega.toFixed(2))),
        },
        {
            name: "Cultura",
            data: membro.historico.map(h => Number(h.mediaCultura.toFixed(2))),
        },
        {
            name: "Feedback",
            data: membro.historico.map(h => Number(h.mediaFeedback.toFixed(2))),
        },
    ]

    return (
        <div style={{ pageBreakInside: 'avoid', marginBottom: '1.5rem' }}>
            <Card className="break-inside-avoid">
                <div className="flex flex-col gap-6">
                    {/* Cabeçalho do Card */}
                    <div className="flex items-center justify-between border-b pb-4" style={{ borderColor: COLORS.border }}>
                        <div className="flex items-center gap-4">
                            {membro.fotoUrl ? (
                                <Image
                                    src={membro.fotoUrl}
                                    alt={membro.nome}
                                    width={64}
                                    height={64}
                                    className="w-16 h-16 rounded-full object-cover border-2"
                                    style={{ borderColor: COLORS.primary }}
                                />
                            ) : (
                                <div 
                                    className="w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold border-2"
                                    style={{ backgroundColor: COLORS.primaryLight, color: COLORS.primary, borderColor: COLORS.primary }}
                                >
                                    {membro.nome.charAt(0)}
                                </div>
                            )}
                            <div>
                                <h3 className="text-xl font-bold" style={{ color: COLORS.textMain }}>{membro.nome}</h3>
                                <p className="text-sm" style={{ color: COLORS.textMuted }}>
                                    {membro.totalAvaliacoesRecebidas} avaliações recebidas
                                </p>
                            </div>
                        </div>

                        {/* Médias Principais */}
                        <div className="flex gap-6">
                            <div className="flex flex-col items-center">
                                <span className="text-xs uppercase font-semibold mb-1" style={{ color: COLORS.textMuted }}>Entrega</span>
                                {membro.mediaEntrega !== null ? (
                                    <span 
                                        className="text-lg font-bold px-3 py-1 rounded"
                                        style={getNotaStyle(membro.mediaEntrega)}
                                    >
                                        {formatNumber(membro.mediaEntrega)}
                                    </span>
                                ) : <span className="text-gray-400">-</span>}
                            </div>
                            <div className="flex flex-col items-center">
                                <span className="text-xs uppercase font-semibold mb-1" style={{ color: COLORS.textMuted }}>Cultura</span>
                                {membro.mediaCultura !== null ? (
                                    <span 
                                        className="text-lg font-bold px-3 py-1 rounded"
                                        style={getNotaStyle(membro.mediaCultura)}
                                    >
                                        {formatNumber(membro.mediaCultura)}
                                    </span>
                                ) : <span className="text-gray-400">-</span>}
                            </div>
                            <div className="flex flex-col items-center">
                                <span className="text-xs uppercase font-semibold mb-1" style={{ color: COLORS.textMuted }}>Feedback</span>
                                {membro.mediaFeedback !== null ? (
                                    <span 
                                        className="text-lg font-bold px-3 py-1 rounded"
                                        style={getNotaStyle(membro.mediaFeedback)}
                                    >
                                        {formatNumber(membro.mediaFeedback)}
                                    </span>
                                ) : <span className="text-gray-400">-</span>}
                            </div>
                        </div>
                    </div>

                    {/* Stats Secundárias: Desvio Padrão */}
                    <div className="flex gap-8 px-2">
                         <div className="flex items-center gap-2">
                            <Activity size={16} style={{ color: COLORS.textMuted }} />
                            <span className="text-sm font-medium" style={{ color: COLORS.textMuted }}>
                                Desvio Padrão Entrega: 
                            </span>
                            <span className="text-sm font-bold" style={{ color: COLORS.textMain }}>
                                {membro.desvioPadraoEntrega.toFixed(2)}
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Activity size={16} style={{ color: COLORS.textMuted }} />
                            <span className="text-sm font-medium" style={{ color: COLORS.textMuted }}>
                                Desvio Padrão Cultura: 
                            </span>
                            <span className="text-sm font-bold" style={{ color: COLORS.textMain }}>
                                {membro.desvioPadraoCultura.toFixed(2)}
                            </span>
                        </div>
                    </div>

                    {/* Gráfico de Evolução do Membro */}
                    <div className="h-[250px] w-full mt-2">
                        <Chart
                            options={options}
                            series={series}
                            type="line"
                            height="100%"
                        />
                    </div>
                </div>
            </Card>
        </div>
    )
}

export function RelatorioContent({ relatorio, cicloId }: RelatorioContentProps) {
    const router = useRouter()
    const reportRef = useRef<HTMLDivElement>(null)
    const [isGenerating, setIsGenerating] = useState(false)

    const handleVoltar = () => {
        router.push("/coord/avaliacoes")
    }

    // REFAZENDO A FUNÇÃO COMPLETA ABAIXO DE FORMA LIMPA
    
    const handleDownloadPDF = async () => {
        if (!reportRef.current) return
        
        setIsGenerating(true)

        // Delay para permitir que o React renderize o estado de loading no botão antes de travar a thread
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Patch styles
        const originalGetComputedStyle = window.getComputedStyle;
        window.getComputedStyle = (elt, pseudoElt) => {
            const styles = originalGetComputedStyle(elt, pseudoElt);
            return new Proxy(styles, {
                get: (target, prop) => {
                    const value = target[prop as keyof CSSStyleDeclaration];
                    if (typeof value === 'function') return (value as Function).bind(target);
                    if (typeof value === 'string' && (value.includes('lab(') || value.includes('oklch('))) return '#ffffff';
                    return value;
                }
            });
        };

        try {
            const reportEl = reportRef.current;
            
            // Renderizar canvas
            const canvas = await html2canvas(reportEl, {
                scale: 2,
                useCORS: true, 
                logging: false,
                backgroundColor: "#ffffff",
                onclone: (doc: Document) => {
                    const el = doc.querySelector('.px-8.py-8.max-w-\\[1200px\\]') as HTMLElement;
                    if (!el) return;

                    // Ajustar container para ser perfeito para impressão
                    el.style.width = '1200px';
                    el.style.maxWidth = 'none';
                    el.style.margin = '0';
                    // Padding bottom 0 para evitar criar uma página nova só com espaço em branco
                    el.style.padding = '40px 40px 0px 40px'; 
                    el.style.minHeight = '100vh';
                    el.style.height = 'fit-content';
                    el.style.overflow = 'visible';
                    el.style.boxSizing = 'border-box';

                    // Constantes de Página
                    const A4_RATIO = 297 / 210;
                    // Definimos uma altura de "página segura" um pouco menor que a real
                    // Para garantir que o corte do jsPDF não pegue a borda inferior dos elementos
                    const PAGE_HEIGHT_REAL = 1200 * A4_RATIO;
                    const PAGE_HEIGHT_SAFE = PAGE_HEIGHT_REAL - 80; // Buffer de 80px

                    const protectedElements = Array.from(doc.querySelectorAll('.break-inside-avoid')) as HTMLElement[];
                    
                    // Ordenar elementos visualmente (embora querySelectorAll já deva vir em ordem)
                    // protectedElements.sort((a, b) => { ... }) 

                    protectedElements.forEach(el => {
                         const rect = el.getBoundingClientRect();
                         const rootRect = doc.body.querySelector('.px-8.py-8.max-w-\\[1200px\\]')!.getBoundingClientRect();
                         
                         // Calcular posição relativa ao topo do relatório
                         const relativeTop = rect.top - rootRect.top;
                         const height = rect.height;
                         
                         // Verificar em qual página (índice) o elemento começa
                         const startPage = Math.floor(relativeTop / PAGE_HEIGHT_REAL);
                         
                         // Verificar onde ele termina (teoricamente)
                         const endPos = relativeTop + height;
                         const endPage = Math.floor(endPos / PAGE_HEIGHT_REAL);

                         // Se cruzar a fronteira de página e couber em uma página única
                         // Empurramos para a próxima página
                         if (startPage !== endPage && height < PAGE_HEIGHT_SAFE) {
                             // Calcular quanto falta para chegar no topo da próxima página
                             const nextPageStart = (startPage + 1) * PAGE_HEIGHT_REAL;
                             const pushAmount = nextPageStart - relativeTop + 40; // +40px margem visual no topo da nova pág
                             
                             // Aplicar margem. Como isso causa reflow, os próximos elementos
                             // terão seu 'rect' atualizado nas próximas iterações (se o browser recalcular layout sinc)
                             // html2canvas onclone roda num contexto onde forçar layout update é possível.
                             el.style.marginTop = `${(parseFloat(el.style.marginTop) || 0) + pushAmount}px`;
                         }
                    });
                }
            } as any);

            // Gerar PDF
            // Mudamos para JPEG com qualidade 0.8 para reduzir drasticamente o tamanho do arquivo
            const imgData = canvas.toDataURL("image/jpeg", 0.8);
            
            // PDF em 'pt' (points) facilita cálculos as vezes, mas 'mm' é padrão A4
            const pdf = new jsPDF({ 
                orientation: "portrait", 
                unit: "mm", 
                format: "a4",
                compress: true // Habilita compressão interna do PDF
            });
            
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();
            const imgWidth = canvas.width;
            const imgHeight = canvas.height;
            
            // Calcular razão para ajustar a largura da imagem à largura do PDF
            const ratio = pdfWidth / imgWidth; 
            
            // Altura total da imagem convertida para unidades do PDF
            const imgHeightInPdfUnits = imgHeight * ratio;
            
            // Total de páginas necessárias
            let totalPages = Math.ceil(imgHeightInPdfUnits / pdfHeight);
            
            // Correção para evitar última página vazia se sobrar apenas filete branco
            // Se a última página tiver menos de 5mm de conteúdo ocupado, ignoramos
            if (totalPages > 1) {
                const lastPageContentHeight = imgHeightInPdfUnits % pdfHeight;
                if (lastPageContentHeight > 0 && lastPageContentHeight < 5) {
                    totalPages--;
                }
            }

            for (let i = 0; i < totalPages; i++) {
                if (i > 0) pdf.addPage();
                
                // Posição Y negativa move a imagem para cima, revelando a fatia correta
                const destY = -(i * pdfHeight);
                
                // Adicionamos a imagem completa em CADA página, mas deslocada
                // O jsPDF faz o "clipping" natural pela área da página
                pdf.addImage(imgData, "PNG", 0, destY, pdfWidth, imgHeight * ratio);
            }
            
            pdf.save(`relatorio-ciclo-${relatorio.cicloNome}.pdf`);
            
        } catch (error) {
            console.error(error);
            alert("Erro ao gerar PDF");
        } finally {
            window.getComputedStyle = originalGetComputedStyle;
            setIsGenerating(false);
        }
    }

    // Calcular min/max para o gráfico de evolução geral
    const allEvolutionValues = [
        ...relatorio.evolucao.map(e => e.mediaEntrega),
        ...relatorio.evolucao.map(e => e.mediaCultura),
        ...relatorio.evolucao.map(e => e.mediaFeedback)
    ];
    const { min: evolucaoMin, max: evolucaoMax } = getChartMinMax(allEvolutionValues);

    const evolucaoOptions: ApexCharts.ApexOptions = {
        chart: {
            type: "line",
            toolbar: { show: false },
            fontFamily: "inherit",
        },
        colors: ["#f9d41a", "#4ade80", "#60a5fa"],
        stroke: {
            curve: "smooth",
            width: 3,
        },
        markers: {
            size: 6,
        },
        xaxis: {
            categories: relatorio.evolucao.map(e => e.avaliacao),
            labels: {
                style: { fontSize: "11px" },
            },
        },
        yaxis: {
            min: evolucaoMin,
            max: evolucaoMax,
            tickAmount: 5,
            labels: {
                formatter: (val) => val.toFixed(1),
            },
        },
        legend: {
            position: "top",
        },
        tooltip: {
            y: {
                formatter: (val) => val.toFixed(2),
            },
        },
    }

    const evolucaoSeries = [
        {
            name: "Entrega",
            data: relatorio.evolucao.map(e => Number(e.mediaEntrega.toFixed(2))),
        },
        {
            name: "Cultura",
            data: relatorio.evolucao.map(e => Number(e.mediaCultura.toFixed(2))),
        },
        {
            name: "Feedback",
            data: relatorio.evolucao.map(e => Number(e.mediaFeedback.toFixed(2))),
        },
    ]

    const areaChartOptions: ApexCharts.ApexOptions = {
        chart: {
            type: "bar",
            toolbar: { show: false },
            fontFamily: "inherit",
        },
        colors: ["#f9d41a", "#4ade80", "#60a5fa"],
        plotOptions: {
            bar: {
                horizontal: false,
                columnWidth: "60%",
                borderRadius: 4,
            },
        },
        xaxis: {
            categories: relatorio.areas.map(a => a.nome),
            labels: {
                style: { fontSize: "10px" },
                rotate: -45,
                rotateAlways: true,
            },
        },
        yaxis: {
            min: 0,
            max: 10,
        },
        legend: {
            position: "top",
        },
        dataLabels: {
            enabled: false,
        },
    }

    const areaChartSeries = [
        {
            name: "Entrega",
            data: relatorio.areas.map(a => Number(a.mediaEntrega.toFixed(2))),
        },
        {
            name: "Cultura",
            data: relatorio.areas.map(a => Number(a.mediaCultura.toFixed(2))),
        },
        {
            name: "Feedback",
            data: relatorio.areas.map(a => Number(a.mediaFeedback.toFixed(2))),
        },
    ]

    return (
        <div className="flex-1 overflow-y-auto" style={{ backgroundColor: COLORS.bgMain }}>
            {/* Header fixo */}
            <div className="border-b sticky top-0 z-10" style={{ backgroundColor: COLORS.bgWhite, borderColor: COLORS.border }}>
                <div className="px-8 py-4 max-w-[1200px] mx-auto w-full flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button
                            variant="secondary"
                            onClick={handleVoltar}
                            icon={<ArrowLeft size={18} />}
                            iconPosition="left"
                        >
                            Voltar
                        </Button>
                        <div>
                            <h1 className="text-xl font-bold" style={{ color: COLORS.textMain }}>
                                Relatório do Ciclo {relatorio.cicloNome}
                            </h1>
                            <p className="text-sm" style={{ color: COLORS.textMuted }}>
                                {relatorio.totalAvaliacoes} avaliações • {relatorio.totalMembros} membros
                            </p>
                        </div>
                    </div>
                    <Button
                        onClick={handleDownloadPDF}
                        isLoading={isGenerating}
                        icon={<Download size={18} />}
                        iconPosition="left"
                    >
                        Baixar PDF
                    </Button>
                </div>
            </div>

            {/* Conteúdo do relatório */}
            <div ref={reportRef} className="px-8 py-8 max-w-[1200px] mx-auto w-full flex flex-col gap-8" style={{ backgroundColor: COLORS.bgWhite }}>
                {/* Cabeçalho do relatório */}
                <div className="text-center pb-6 border-b" style={{ borderColor: COLORS.border }}>
                    <div className="flex items-center justify-center gap-3 mb-2">
                        <FileText size={32} style={{ color: COLORS.primary }} />
                        <h1 className="text-3xl font-bold" style={{ color: COLORS.textMain }}>
                            Relatório de Avaliação Contínua
                        </h1>
                    </div>
                    <p className="text-xl font-semibold" style={{ color: COLORS.primary }}>Ciclo {relatorio.cicloNome}</p>
                    <p className="text-sm mt-1" style={{ color: COLORS.textMuted }}>
                        Gerado em {new Date().toLocaleDateString("pt-BR", { 
                            day: "2-digit", 
                            month: "long", 
                            year: "numeric" 
                        })}
                    </p>
                </div>

                {/* Cards de resumo */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card className="text-center">
                        <div className="flex flex-col items-center gap-2">
                            <div className="p-3 rounded-full" style={{ backgroundColor: COLORS.primaryLight }}>
                                <BarChart3 size={24} style={{ color: COLORS.primary }} />
                            </div>
                            <span className="text-sm" style={{ color: COLORS.textMuted }}>Avaliações</span>
                            <span className="text-2xl font-bold" style={{ color: COLORS.textMain }}>{relatorio.totalAvaliacoes}</span>
                        </div>
                    </Card>
                    <Card className="text-center">
                        <div className="flex flex-col items-center gap-2">
                            <div className="p-3 rounded-full" style={{ backgroundColor: COLORS.primaryLight }}>
                                <Users size={24} style={{ color: COLORS.primary }} />
                            </div>
                            <span className="text-sm" style={{ color: COLORS.textMuted }}>Membros</span>
                            <span className="text-2xl font-bold" style={{ color: COLORS.textMain }}>{relatorio.totalMembros}</span>
                        </div>
                    </Card>
                    <Card className="text-center">
                        <div className="flex flex-col items-center gap-2">
                            <div className="p-3 rounded-full" style={{ backgroundColor: COLORS.primaryLight }}>
                                <TrendingUp size={24} style={{ color: COLORS.primary }} />
                            </div>
                            <span className="text-sm" style={{ color: COLORS.textMuted }}>Média Entrega</span>
                            <span className="text-2xl font-bold" style={{ color: getNotaStyle(relatorio.mediaGeralEntrega).color }}>
                                {formatNumber(relatorio.mediaGeralEntrega)}
                            </span>
                        </div>
                    </Card>
                    <Card className="text-center">
                        <div className="flex flex-col items-center gap-2">
                            <div className="p-3 rounded-full" style={{ backgroundColor: COLORS.primaryLight }}>
                                <TrendingUp size={24} style={{ color: COLORS.primary }} />
                            </div>
                            <span className="text-sm" style={{ color: COLORS.textMuted }}>Média Cultura</span>
                            <span className="text-2xl font-bold" style={{ color: getNotaStyle(relatorio.mediaGeralCultura).color }}>
                                {formatNumber(relatorio.mediaGeralCultura)}
                            </span>
                        </div>
                    </Card>
                </div>

                {/* Gráfico de evolução geral */}
                {relatorio.evolucao.length > 0 && (
                    <Card>
                        <h2 className="text-lg font-bold mb-4 flex items-center gap-2" style={{ color: COLORS.textMain }}>
                            <TrendingUp size={20} style={{ color: COLORS.primary }} />
                            Evolução das Notas ao Longo do Ciclo (Geral)
                        </h2>
                        <div className="h-[300px]">
                            <Chart
                                options={evolucaoOptions}
                                series={evolucaoSeries}
                                type="line"
                                height="100%"
                            />
                        </div>
                    </Card>
                )}

                {/* Gráfico comparativo por área */}
                {relatorio.areas.length > 0 && (
                    <Card>
                        <h2 className="text-lg font-bold mb-4 flex items-center gap-2" style={{ color: COLORS.textMain }}>
                            <BarChart3 size={20} style={{ color: COLORS.primary }} />
                            Comparativo por Área
                        </h2>
                        <div className="h-[350px]">
                            <Chart
                                options={areaChartOptions}
                                series={areaChartSeries}
                                type="bar"
                                height="100%"
                            />
                        </div>
                    </Card>
                )}

                {/* Detalhamento por Área (Cards de Membros) */}
                {relatorio.areas.map((area) => (
                    <div key={area.nome} className="flex flex-col gap-6">
                        {/* Cabeçalho da Área */}
                        <div style={{ pageBreakInside: 'avoid', marginTop: '2rem' }}>
                            <Card className="break-inside-avoid">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-2xl font-bold" style={{ color: COLORS.textMain }}>{area.nome}</h2>
                                    <div className="flex gap-6">
                                        <div className="flex flex-col items-center">
                                            <span className="text-xs uppercase" style={{ color: COLORS.textMuted }}>Média E</span>
                                            <span className="text-lg font-bold" style={{ color: getNotaStyle(area.mediaEntrega).color }}>
                                                {formatNumber(area.mediaEntrega)}
                                            </span>
                                        </div>
                                        <div className="flex flex-col items-center">
                                            <span className="text-xs uppercase" style={{ color: COLORS.textMuted }}>Média C</span>
                                            <span className="text-lg font-bold" style={{ color: getNotaStyle(area.mediaCultura).color }}>
                                                {formatNumber(area.mediaCultura)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="mt-6 h-[250px]">
                                     <h3 className="text-sm font-semibold mb-2" style={{ color: COLORS.textMuted }}>Evolução da Área</h3>
                                     <Chart
                                        options={{
                                            ...evolucaoOptions,
                                            yaxis: {
                                                ...evolucaoOptions.yaxis,
                                                min: getChartMinMax([
                                                    ...area.evolucao.map(e => e.mediaEntrega),
                                                    ...area.evolucao.map(e => e.mediaCultura),
                                                    ...area.evolucao.map(e => e.mediaFeedback)
                                                ]).min,
                                                max: getChartMinMax([
                                                    ...area.evolucao.map(e => e.mediaEntrega),
                                                    ...area.evolucao.map(e => e.mediaCultura),
                                                    ...area.evolucao.map(e => e.mediaFeedback)
                                                ]).max
                                            }
                                        }}
                                        series={[
                                            { name: "Entrega", data: area.evolucao.map(e => Number(e.mediaEntrega.toFixed(2))) },
                                            { name: "Cultura", data: area.evolucao.map(e => Number(e.mediaCultura.toFixed(2))) },
                                            { name: "Feedback", data: area.evolucao.map(e => Number(e.mediaFeedback.toFixed(2))) },
                                        ]}
                                        type="line"
                                        height="100%"
                                    />
                                </div>
                            </Card>
                        </div>

                        {/* Cards dos Membros da Área */}
                        <div className="grid grid-cols-1 gap-6">
                            {area.membros.map((membro) => (
                                <MembroCardRelatorio key={membro.id} membro={membro} />
                            ))}
                        </div>
                    </div>
                ))}

                {/* Rodapé do relatório */}
                <div className="text-center pt-6 border-t text-sm" style={{ borderColor: COLORS.border, color: COLORS.textMuted }}>
                    <p>Relatório gerado automaticamente pelo Sistema de Avaliação Contínua</p>
                </div>
            </div>
        </div>
    )
}
