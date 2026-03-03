import { Avaliacoes360Editor } from "@/src/app/components/coords/avaliacao360/Avaliacoes360Editor"

export default function EditarAvaliacao360Page({ params }: { params: { id: string } }) {
    return <Avaliacoes360Editor id={Number(params.id)} />
}
