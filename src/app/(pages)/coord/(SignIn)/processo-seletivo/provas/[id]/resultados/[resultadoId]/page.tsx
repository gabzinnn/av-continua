import { CorrecaoResultadoContent } from "@/src/app/components/coords/provas/CorrecaoResultadoContent";

interface CorrecaoPageProps {
    params: Promise<{ id: string; resultadoId: string }>
}

export default async function CorrecaoPage({ params }: CorrecaoPageProps) {
    const { id, resultadoId } = await params
    return <CorrecaoResultadoContent provaId={parseInt(id)} resultadoId={parseInt(resultadoId)} />
}
