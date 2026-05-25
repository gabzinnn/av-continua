import { notFound } from "next/navigation"
import { getPCOParaEditar } from "@/src/actions/pcoActions"
import { EditarPCOContent } from "@/src/app/components/coords/pco/EditarPCOContent"

export default async function EditarPCOPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const pco = await getPCOParaEditar(Number(id))

    if (!pco) notFound()

    return <EditarPCOContent pcoInicial={pco} />
}
