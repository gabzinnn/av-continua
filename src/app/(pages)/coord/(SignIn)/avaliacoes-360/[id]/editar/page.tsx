import { Avaliacoes360Editor } from "@/src/app/components/coords/avaliacao360/Avaliacoes360Editor"

export default async function EditarAvaliacao360Page({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    return <Avaliacoes360Editor id={Number(id)} />
}
