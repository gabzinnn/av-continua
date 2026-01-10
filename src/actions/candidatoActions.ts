"use server";

import prisma from "@/src/lib/prisma";

interface CadastrarCandidatoInput {
    nome: string;
    email: string;
    curso: string;
    periodo: string;
    dre: string;
    provaId: number;
}

interface CadastrarCandidatoResult {
    success: boolean;
    candidato?: {
        id: number;
        nome: string;
        email: string;
        curso: string | null;
        periodo: string | null;
        dre: string;
    };
    resultadoId?: number;
    error?: string;
}

export async function cadastrarCandidato(
    input: CadastrarCandidatoInput
): Promise<CadastrarCandidatoResult> {
    try {
        // Verifica se a prova existe e está publicada
        const prova = await prisma.prova.findUnique({
            where: { id: input.provaId },
        });

        if (!prova) {
            return { success: false, error: "Prova não encontrada" };
        }

        if (prova.status !== "PUBLICADA") {
            return { success: false, error: "Esta prova não está disponível" };
        }

        // Cria ou atualiza o candidato pelo email usando upsert
        const candidato = await prisma.candidato.upsert({
            where: { email: input.email },
            update: {
                nome: input.nome,
                curso: input.curso,
                periodo: input.periodo,
                dre: input.dre,
            },
            create: {
                nome: input.nome,
                email: input.email,
                curso: input.curso,
                periodo: input.periodo,
                dre: input.dre,
            },
        });

        // Cria ou busca resultado de prova usando upsert
        const resultado = await prisma.resultadoProva.upsert({
            where: {
                provaId_candidatoId: {
                    provaId: input.provaId,
                    candidatoId: candidato.id,
                },
            },
            update: {
                // Não atualiza nada, apenas retorna o existente
            },
            create: {
                provaId: input.provaId,
                candidatoId: candidato.id,
                status: "PENDENTE",
            },
        });

        // Verifica se já finalizou
        if (resultado.finalizadoEm) {
            return {
                success: false,
                error: "Você já finalizou esta prova anteriormente",
            };
        }

        return {
            success: true,
            candidato: {
                id: candidato.id,
                nome: candidato.nome,
                email: candidato.email,
                curso: candidato.curso,
                periodo: candidato.periodo,
                dre: candidato.dre,
            },
            resultadoId: resultado.id,
        };
    } catch (error) {
        console.error("Erro ao cadastrar candidato:", error);
        return {
            success: false,
            error: "Erro ao processar cadastro. Tente novamente.",
        };
    }
}

export async function getProvaParaCandidato(provaId: number, candidatoId: number) {
    try {
        const prova = await prisma.prova.findUnique({
            where: { id: provaId },
            include: {
                questoes: {
                    orderBy: { ordem: "asc" },
                    include: {
                        alternativas: {
                            orderBy: { ordem: "asc" },
                            select: {
                                id: true,
                                texto: true,
                                ordem: true,
                                // NÃO selecionar 'correta'
                            },
                        },
                        imagens: {
                            orderBy: { ordem: "asc" },
                            select: {
                                id: true,
                                url: true,
                                ordem: true,
                            },
                        },
                    },
                },
            },
        });

        if (!prova) return null;

        // Busca resultado para pegar respostas já salvas
        const resultado = await prisma.resultadoProva.findUnique({
            where: {
                provaId_candidatoId: {
                    provaId,
                    candidatoId,
                },
            },
            include: {
                respostas: true,
            },
        });

        // Calcula tempo restante
        let tempoRestante = 0;
        if (prova.tempoLimite && resultado) {
            const agora = new Date();
            const inicio = new Date(resultado.iniciadoEm);
            const fimPrevisto = new Date(inicio.getTime() + prova.tempoLimite * 60000);
            const diffMs = fimPrevisto.getTime() - agora.getTime();
            tempoRestante = Math.max(0, Math.floor(diffMs / 1000));
        }

        return {
            prova: {
                ...prova,
                questoes: prova.questoes.map((q) => ({
                    ...q,
                    pontos: Number(q.pontos),
                })),
            },
            respostasSalvas: resultado?.respostas || [],
            tempoRestante,
            resultadoId: resultado?.id,
        };
    } catch (error) {
        console.error("Erro ao buscar prova para candidato:", error);
        return null;
    }
}

export async function salvarResposta(
    resultadoId: number,
    questaoId: number,
    alternativaId: number | null,
    respostaTexto: string | null
) {
    try {
        // Upsert na resposta usando findFirst primeiro porque não há ensureID exclusivo (embora haja @unique)
        // O prisma upsert exige @unique ou @id, e resultadoId_questaoId pode não estar exposto se não for composto.
        // Mas o schema diz: "@@unique([resultadoId, questaoId])" (Vou assumir que existe, senão usaria findFirst + create/update)
        // Checando schema... RespostaQuestao tem @@unique([resultadoId, questaoId])?
        // Verificando schema anteriormente... NÂO VI essa unique constraint explicita no snippet.
        // Vou usar findFirst e depois create ou update para ser seguro.

        const existingResposta = await prisma.respostaQuestao.findFirst({
            where: {
                resultadoId,
                questaoId,
            },
        });

        if (existingResposta) {
            await prisma.respostaQuestao.update({
                where: { id: existingResposta.id },
                data: {
                    alternativaId,
                    respostaTexto,
                },
            });
        } else {
            await prisma.respostaQuestao.create({
                data: {
                    resultadoId,
                    questaoId,
                    alternativaId,
                    respostaTexto,
                },
            });
        }

        return { success: true };
    } catch (error) {
        console.error("Erro ao salvar resposta:", error);
        return { success: false, error: "Erro ao salvar resposta" };
    }
}

export async function finalizarProva(resultadoId: number) {
    try {
        await prisma.resultadoProva.update({
            where: { id: resultadoId },
            data: {
                finalizadoEm: new Date(),
                status: "PENDENTE",
            },
        });
        return { success: true };
    } catch (error) {
        console.error("Erro ao finalizar prova:", error);
        return { success: false, error: "Erro ao finalizar prova" };
    }
}
