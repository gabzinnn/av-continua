import prisma from "@/src/lib/prisma";
import { notFound } from "next/navigation";
import InstrucoesContent from "./InstrucoesContent";

interface InstrucoesPageProps {
    params: Promise<{ id: string }>;
}

export default async function InstrucoesPage({ params }: InstrucoesPageProps) {
    const { id } = await params;
    const provaId = parseInt(id, 10);

    if (isNaN(provaId)) {
        notFound();
    }

    // Busca a prova com tempo limite
    const prova = await prisma.prova.findUnique({
        where: { id: provaId },
        select: {
            id: true,
            titulo: true,
            descricao: true,
            tempoLimite: true,
            status: true,
        },
    });

    if (!prova || prova.status !== "PUBLICADA") {
        notFound();
    }

    return <InstrucoesContent prova={prova} />;
}
