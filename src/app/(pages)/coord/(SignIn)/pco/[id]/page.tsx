import { PCODetalhesContent } from "@/src/app/components/coords/pco/PCODetalhesContent"

interface Props {
    params: Promise<{ id: string }>
}

export default async function PCODetalhesPage({ params }: Props) {
    const { id } = await params
    return <PCODetalhesContent pcoId={parseInt(id)} />
}
