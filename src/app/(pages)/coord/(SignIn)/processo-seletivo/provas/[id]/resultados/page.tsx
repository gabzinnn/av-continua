import { ProvaResultadosContent } from "@/src/app/components/coords/provas/ProvaResultadosContent"


interface ResultadosPageProps {
    params: Promise<{ id: string }>
}

export default async function ResultadosPage({ params }: ResultadosPageProps) {
    const { id } = await params
    return <ProvaResultadosContent provaId={parseInt(id)} />
}
