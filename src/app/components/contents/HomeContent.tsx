"use client"

import { useMember } from "@/src/context/memberContext"
import { Card } from "@/src/app/components/Card"
import { Button } from "@/src/app/components/Button"
import { useEffect, useState } from "react"
import { getHomeData } from "@/src/actions/homeActions"
import { EvolucaoChart } from "../EvolucaoChart"
import { useRouter } from "next/navigation"
import Link from "next/link"

interface EvolucaoData {
  mes: string
  entrega: number
  cultura: number
  feedback: number
}

interface Atividade {
  tipo: string
  data: string
  status: "concluido" | "pendente"
}

interface HomeData {
  mediaEntrega: number
  variacaoEntrega: number
  mediaAlinhamento: number
  variacaoAlinhamento: number
  avaliacaoPendente: boolean
  evolucaoDesempenho: EvolucaoData[]
  atividadesRecentes: Atividade[]
}

export function HomeContent() {
  const router = useRouter()
  const { selectedMember, isLoading: isMemberLoading } = useMember()
  const [data, setData] = useState<HomeData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const primeiroNome = selectedMember?.nome.split(" ")[0] || "Usuário"

  useEffect(() => {
    async function fetchData() {
      if (!selectedMember?.id) return
      
      setIsLoading(true)
      try {
        const homeData = await getHomeData(Number(selectedMember.id))
        setData(homeData)
      } catch (error) {
        console.error("Erro ao carregar dados:", error)
      } finally {
        setIsLoading(false)
      }
    }

    if (!isMemberLoading) {
      fetchData()
    }
  }, [selectedMember?.id, isMemberLoading])

  if (isMemberLoading || isLoading || !data) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-text-muted">Carregando...</div>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="w-full max-w-[1200px] mx-auto p-6 md:p-8 flex flex-col gap-8">
        {/* Page Heading */}
        <div className="flex flex-col gap-1">
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-text-main">
            Olá, {primeiroNome}
          </h2>
          <p className="text-text-muted">Bem-vindo ao seu painel de desempenho.</p>
        </div>

        {/* Action Alert Banner */}
        {data.avaliacaoPendente && (
          <div className="w-full bg-bg-card rounded-xl border-l-8 border-primary shadow-sm p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex items-start gap-5">
              <div className="bg-primary/10 p-3 rounded-full shrink-0 hidden sm:flex">
                <span className="material-symbols-outlined text-amber-600 text-3xl">
                  assignment_late
                </span>
              </div>
              <div className="flex flex-col gap-1">
                <h3 className="text-lg font-bold text-text-main">Avaliação Pendente</h3>
                <p className="text-text-muted text-sm max-w-xl">
                  Você tem uma avaliação contínua em aberto. O preenchimento dela é obrigatório para todos os membros.
                </p>
              </div>
            </div>
            <Button size="md" className="whitespace-nowrap w-full md:w-auto" onClick={() => router.push("/avatual")}>
              Responder Agora
            </Button>
          </div>
        )}

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* KPI 1 - Média de Entrega */}
          <Card>
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <p className="text-text-muted text-sm font-medium">Média de Entrega</p>
                <span className="material-symbols-outlined text-primary">rocket_launch</span>
              </div>
              <div className="flex items-end gap-3">
                <p className="text-4xl font-bold text-text-main tracking-tight">
                  {data.mediaEntrega.toFixed(1)}
                  <span className="text-xl text-text-muted font-normal">/10</span>
                </p>
                <VariacaoBadge valor={data.variacaoEntrega} />
              </div>
            </div>
          </Card>

          {/* KPI 2 - Média de Alinhamento Cultural */}
          <Card>
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <p className="text-text-muted text-sm font-medium">Média de Alinhamento Cultural</p>
                <span className="material-symbols-outlined text-primary">diversity_3</span>
              </div>
              <div className="flex items-end gap-3">
                <p className="text-4xl font-bold text-text-main tracking-tight">
                  {data.mediaAlinhamento.toFixed(1)}
                  <span className="text-xl text-text-muted font-normal">/10</span>
                </p>
                <VariacaoBadge valor={data.variacaoAlinhamento} />
              </div>
            </div>
          </Card>
        </div>

        {/* Performance Chart Section */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-xl font-bold text-text-main">Evolução de Desempenho</h3>
            <Link href="/historico" className="text-sm text-text-muted hover:text-primary transition-colors flex items-center gap-1 cursor-pointer">
              Ver Detalhes{" "}
              <span className="material-symbols-outlined text-[16px]">chevron_right</span>
            </Link>
          </div>

          <Card className="h-80">
            <EvolucaoChart data={data.evolucaoDesempenho} />
          </Card>
        </div>
      </div>
    </div>
  )
}

// Componente auxiliar para badge de variação
function VariacaoBadge({ valor }: { valor: number }) {
  const isPositivo = valor >= 0
  return (
    <span
      className={`
      ${isPositivo ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}
      text-xs font-bold px-2 py-1 rounded-full mb-1 flex items-center gap-1
    `}
    >
      <span className="material-symbols-outlined text-[14px]">
        {isPositivo ? "trending_up" : "trending_down"}
      </span>
      {isPositivo ? "+" : ""}
      {valor.toFixed(1)}%
    </span>
  )
}