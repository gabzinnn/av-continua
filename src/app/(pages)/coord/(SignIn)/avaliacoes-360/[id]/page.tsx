import { Relatorio360Content } from "@/src/app/components/coords/avaliacao360/Relatorio360Content"
import React from "react"

export default async function Relatorio360Page({ params }: { params: Promise<{ id: string }> }) {
    const p = await params;
    return <Relatorio360Content id={Number(p.id)} />
}
