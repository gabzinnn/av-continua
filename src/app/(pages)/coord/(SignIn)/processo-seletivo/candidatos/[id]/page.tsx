import { CandidatosProcessoContent } from "@/src/app/components/coords/candidatos/CandidatosProcessoContent"

interface CandidatosProcessoPageProps {
    params: Promise<{ id: string }>
}

export default async function CandidatosProcessoPage({ params }: CandidatosProcessoPageProps) {
    const { id } = await params
    return <CandidatosProcessoContent processoId={parseInt(id)} />
}
