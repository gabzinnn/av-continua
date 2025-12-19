import { getDetalheAvaliacao } from "@/src/actions/controleAvaliacoesActions"
import { DetalheAvaliacaoContent } from "@/src/app/components/coords/DetalheAvaliacaoContent"
import { notFound } from "next/navigation"

interface PageProps {
    params: Promise<{ id: string }>
}

export default async function DetalheAvaliacaoPage({ params }: PageProps) {
    const { id } = await params
    const avaliacaoId = parseInt(id, 10)

    if (isNaN(avaliacaoId)) {
        notFound()
    }

    const avaliacao = await getDetalheAvaliacao(avaliacaoId)

    if (!avaliacao) {
        notFound()
    }

    return <DetalheAvaliacaoContent avaliacao={avaliacao} />
}
