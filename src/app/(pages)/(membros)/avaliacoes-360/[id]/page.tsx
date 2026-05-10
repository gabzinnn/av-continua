import { ResponderAvaliacao360MatrixContent } from "@/src/app/components/membro/ResponderAvaliacao360MatrixContent"
import React from "react"

export default async function ResponderAvaliacao360Page({ params }: { params: Promise<{ id: string }> }) {
    const p = await params;
    return <ResponderAvaliacao360MatrixContent avaliacaoId={Number(p.id)} />
}
