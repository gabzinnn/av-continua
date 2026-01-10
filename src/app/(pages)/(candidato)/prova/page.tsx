import { redirect } from "next/navigation";
import IdentificacaoContent from "./IdentificacaoContent";
import prisma from "@/src/lib/prisma";

export default async function ProvaPage() {
    // Busca a única prova ativa (PUBLICADA)
    const provaAtiva = await prisma.prova.findFirst({
        where: {
            status: "PUBLICADA",
        },
        select: {
            id: true,
            titulo: true,
            descricao: true,
            tempoLimite: true,
        },
    });

    // Se não houver prova ativa, mostra mensagem
    if (!provaAtiva) {
        return (
            <div className="w-full max-w-[640px] bg-bg-card rounded-2xl shadow-lg border border-border-ui overflow-hidden relative z-10">
                <div className="flex justify-center pt-10 pb-2">
                    <div className="w-20 h-20 bg-stone-50 rounded-2xl flex items-center justify-center border border-stone-100 shadow-sm">
                        <span className="material-symbols-outlined text-4xl text-primary">
                            event_busy
                        </span>
                    </div>
                </div>
                <div className="px-8 pb-10 pt-4 sm:px-12 sm:pb-12 text-center">
                    <h1 className="text-2xl sm:text-3xl font-bold text-text-main mb-4">
                        Nenhuma prova disponível
                    </h1>
                    <p className="text-text-muted">
                        No momento não há nenhuma prova ativa para realização.
                        <br />
                        Entre em contato com a coordenação para mais informações.
                    </p>
                </div>
            </div>
        );
    }

    return <IdentificacaoContent prova={provaAtiva} />;
}
