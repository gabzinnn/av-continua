import { getRelatorioCiclo } from "@/src/actions/relatorioActions"
import { RelatorioContent } from "@/src/app/components/coords/RelatorioContent"
import { redirect } from "next/navigation"

interface PageProps {
    params: Promise<{ cicloId: string }>
}

export default async function RelatorioPage({ params }: PageProps) {
    const { cicloId } = await params
    const id = parseInt(cicloId, 10)
    
    if (isNaN(id)) {
        redirect("/coord/avaliacoes")
    }

    const relatorio = await getRelatorioCiclo(id)
    
    if (!relatorio) {
        redirect("/coord/avaliacoes")
    }

    return <RelatorioContent relatorio={relatorio} cicloId={id} />
}
