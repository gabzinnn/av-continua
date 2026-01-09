import { TermometroDetalhesContent } from "@/src/app/components/coords/termometro/TermometroDetalhesContent"

interface Props {
    params: Promise<{ id: string }>
}

export default async function TermometroDetalhesPage({ params }: Props) {
    const { id } = await params
    return <TermometroDetalhesContent termometroId={parseInt(id)} />
}
