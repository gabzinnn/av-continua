// npx prisma migrate dev --name add_avaliacao_360
// npx prisma generate
"use server"

import prisma from "@/src/lib/prisma"
import { revalidatePath } from "next/cache"
import { StatusAvaliacao360, TipoPergunta360 } from "@/src/generated/prisma/client"
import type { AV360ReportData, AV360MembroDetalhes } from "@/src/lib/reports/av360/types"

// Tipos para Retorno e View
export type Avaliacao360Resumo = {
    id: number
    nome: string
    status: StatusAvaliacao360
    dataInicio: Date | null
    dataFim: Date | null
    totalParticipantes: number
    totalRespostas: number
    taxaResposta: number
    totalPares: number
    createdAt: Date
}

export type Avaliacao360PageData = {
    avaliacoes: Avaliacao360Resumo[]
    cicloAtivo: {
        id: number
        nome: string
        diasRestantes: number | null
        progresso: number
    } | null
    metricas: {
        mediaGlobal: number
        engajamentoGlobal: number
        variacaoEngajamento: number // Comparado ao ciclo anterior
    }
}

/**
 * Pega os dados para renderizar a tabela e os cards superiores da página de Coordenadoria
 */
export async function getAvaliacoes360PageData(): Promise<Avaliacao360PageData> {
    try {
        const avaliacoes = await prisma.avaliacao360.findMany({
            include: {
                feedbacks: true,
                ciclo: true
            },
            orderBy: {
                createdAt: 'desc'
            }
        })

        const resumos = avaliacoes.map(av => {
            const feedbacks = av.feedbacks
            const totalParticipantes = feedbacks.length
            const feedbacksFinalizados = feedbacks.filter(f => f.finalizado).length
            const taxaResposta = totalParticipantes > 0
                ? Math.round((feedbacksFinalizados / totalParticipantes) * 100)
                : 0

            return {
                id: av.id,
                nome: av.nome,
                status: av.status,
                dataInicio: av.dataInicio,
                dataFim: av.dataFim,
                totalParticipantes,
                totalRespostas: feedbacksFinalizados,
                taxaResposta,
                totalPares: feedbacks.length,
                createdAt: av.createdAt
            }
        })

        // TODO: Métrica simplificada pro teste real (Média simulada)
        return {
            avaliacoes: resumos,
            cicloAtivo: null,
            metricas: {
                mediaGlobal: 0,
                engajamentoGlobal: 0,
                variacaoEngajamento: 0
            }
        }
    } catch (error) {
        console.error("Erro ao carregar dados da página de avaliação 360", error)
        throw new Error("Não foi possível carregar os dados")
    }
}

export async function criarAvaliacao360(data: { nome: string, idCiclo?: number }) {
    try {
        const nova = await prisma.avaliacao360.create({
            data: {
                nome: data.nome,
                idCiclo: data.idCiclo,
                status: StatusAvaliacao360.RASCUNHO
            }
        })
        revalidatePath('/coord/avaliacoes-360')
        return { success: true, data: nova }
    } catch (error) {
        console.error(error)
        return { success: false, error: "Erro ao criar avaliação" }
    }
}

export async function duplicarAvaliacao360(id: number) {
    try {
        const original = await prisma.avaliacao360.findUnique({
            where: { id },
            include: {
                dimensoes: {
                    include: { perguntas: { orderBy: { ordem: 'asc' } } },
                    orderBy: { ordem: 'asc' }
                }
            }
        })
        if (!original) return { success: false, error: "Avaliação não encontrada" }

        const nova = await prisma.$transaction(async (tx) => {
            const criada = await tx.avaliacao360.create({
                data: {
                    nome: `Cópia de ${original.nome}`,
                    status: StatusAvaliacao360.RASCUNHO,
                }
            })

            for (let i = 0; i < original.dimensoes.length; i++) {
                const dim = original.dimensoes[i]
                const novaDim = await tx.dimensao360.create({
                    data: { avaliacaoId: criada.id, titulo: dim.titulo, ordem: i }
                })
                if (dim.perguntas.length > 0) {
                    await tx.pergunta360.createMany({
                        data: dim.perguntas.map((p, j) => ({
                            dimensaoId: novaDim.id,
                            texto: p.texto,
                            tipo: p.tipo,
                            obrigatoria: p.obrigatoria,
                            ordem: j
                        }))
                    })
                }
            }

            return criada
        })

        revalidatePath('/coord/avaliacoes-360')
        return { success: true, id: nova.id }
    } catch (error) {
        console.error(error)
        return { success: false, error: "Erro ao duplicar avaliação" }
    }
}

export async function deletarAvaliacao360(id: number) {
    try {
        await prisma.avaliacao360.delete({
            where: { id }
        })
        revalidatePath('/coord/avaliacoes-360')
        return { success: true }
    } catch (error) {
        console.error(error)
        return { success: false, error: "Erro ao deletar" }
    }
}

export async function reabrirAvaliacao360(id: number): Promise<{ success: boolean; error?: string }> {
    try {
        await prisma.avaliacao360.update({
            where: { id },
            data: { status: StatusAvaliacao360.ATIVA, dataFim: null },
        })
        revalidatePath('/coord/avaliacoes-360')
        return { success: true }
    } catch (error) {
        console.error(error)
        return { success: false, error: "Erro ao reabrir avaliação" }
    }
}

export async function getAvaliacao360ById(id: number) {
    try {
        const avaliacao = await prisma.avaliacao360.findUnique({
            where: { id },
            include: {
                dimensoes: {
                    include: {
                        perguntas: {
                            orderBy: { ordem: 'asc' }
                        }
                    },
                    orderBy: { ordem: 'asc' }
                }
            }
        })
        return avaliacao
    } catch (error) {
        console.error(error)
        return null
    }
}

export async function gerarParesAvaliacao360(idCiclo: number): Promise<Array<{avaliadorId: number, avaliadoId: number}>> {
    const [membrosAtivos, todasAlocacoes, coordenadoresObrigatoriosPorArea] = await Promise.all([
        prisma.membro.findMany({
            where: { isAtivo: true },
            include: { area: true, subarea: true },
            orderBy: [{ area: { nome: "asc" } }, { nome: "asc" }],
        }),
        prisma.alocacaoDemanda.findMany({
            where: {
                membro: { isAtivo: true },
                demanda: { idCiclo: idCiclo }
            },
            select: {
                membroId: true,
                demandaId: true,
                isLider: true,
                demanda: {
                    select: { idArea: true, idSubarea: true, finalizada: true }
                }
            },
        }),
        prisma.membro.findMany({
            where: {
                isCoordenador: true,
                isAtivo: true,
            },
            include: { area: true },
        }),
    ])

    const demandasPorMembro = new Map<number, number[]>()
    const membrosPorDemanda = new Map<number, number[]>()
    const lideresPorArea = new Map<number, number[]>()
    const lideresPorSubarea = new Map<number, number[]>()
    const subareasOndeEhLider = new Map<number, number[]>()

    for (const aloc of todasAlocacoes) {
        if (!demandasPorMembro.has(aloc.membroId)) {
            demandasPorMembro.set(aloc.membroId, [])
        }
        demandasPorMembro.get(aloc.membroId)!.push(aloc.demandaId)

        if (!membrosPorDemanda.has(aloc.demandaId)) {
            membrosPorDemanda.set(aloc.demandaId, [])
        }
        membrosPorDemanda.get(aloc.demandaId)!.push(aloc.membroId)

        if (aloc.isLider) {
            if (aloc.demanda.idSubarea) {
                if (!lideresPorSubarea.has(aloc.demanda.idSubarea)) {
                    lideresPorSubarea.set(aloc.demanda.idSubarea, [])
                }
                lideresPorSubarea.get(aloc.demanda.idSubarea)!.push(aloc.membroId)

                if (!subareasOndeEhLider.has(aloc.membroId)) {
                    subareasOndeEhLider.set(aloc.membroId, [])
                }
                subareasOndeEhLider.get(aloc.membroId)!.push(aloc.demanda.idSubarea)
            } else if (aloc.demanda.idArea) {
                if (!lideresPorArea.has(aloc.demanda.idArea)) {
                    lideresPorArea.set(aloc.demanda.idArea, [])
                }
                lideresPorArea.get(aloc.demanda.idArea)!.push(aloc.membroId)
            }
        }
    }

    const coordenadoresOICG = coordenadoresObrigatoriosPorArea
        .filter(c => c.area.nome === "Organização Interna" || c.area.nome === "Coordenação Geral")
        .map(c => c.id)

    const todosCoordenadoresIds = coordenadoresObrigatoriosPorArea.map(c => c.id)

    const coordenadorPorArea = new Map<number, number[]>()
    for (const coord of coordenadoresObrigatoriosPorArea) {
        if (!coordenadorPorArea.has(coord.areaId)) {
            coordenadorPorArea.set(coord.areaId, [])
        }
        coordenadorPorArea.get(coord.areaId)!.push(coord.id)
    }

    const lideresSubareaPorArea = new Map<number, number[]>()
    for (const membro of membrosAtivos) {
        if (membro.isLiderSubarea && membro.subareaId) {
            if (!lideresSubareaPorArea.has(membro.areaId)) {
                lideresSubareaPorArea.set(membro.areaId, [])
            }
            lideresSubareaPorArea.get(membro.areaId)!.push(membro.id)
        }
    }

    const pares = new Set<string>()

    for (const membro of membrosAtivos) {
        const membrosAvaliadosIds = new Set<number>()

        const demandaIds = demandasPorMembro.get(membro.id) || []
        for (const demandaId of demandaIds) {
            const membrosNaDemanda = membrosPorDemanda.get(demandaId) || []
            for (const membroId of membrosNaDemanda) {
                if (membroId !== membro.id) {
                    membrosAvaliadosIds.add(membroId)
                }
            }
        }

        const coordsDaArea = coordenadorPorArea.get(membro.areaId) || []
        for (const coordId of coordsDaArea) {
            if (coordId !== membro.id) {
                membrosAvaliadosIds.add(coordId)
            }
        }
        for (const coordId of coordenadoresOICG) {
            if (coordId !== membro.id) {
                membrosAvaliadosIds.add(coordId)
            }
        }

        if (membro.isCoordenador) {
            const lideresSubarea = lideresSubareaPorArea.get(membro.areaId) || []
            for (const liderId of lideresSubarea) {
                if (liderId !== membro.id) {
                    membrosAvaliadosIds.add(liderId)
                }
            }

            const lideresDaArea = lideresPorArea.get(membro.areaId) || []
            for (const liderId of lideresDaArea) {
                if (liderId !== membro.id) {
                    membrosAvaliadosIds.add(liderId)
                }
            }

            for (const coordId of todosCoordenadoresIds) {
                if (coordId !== membro.id) {
                    membrosAvaliadosIds.add(coordId)
                }
            }
        }

        if (membro.isLiderSubarea && membro.subareaId) {
            const lideresDemanda = lideresPorSubarea.get(membro.subareaId) || []
            for (const liderId of lideresDemanda) {
                if (liderId !== membro.id) {
                    membrosAvaliadosIds.add(liderId)
                }
            }
        }

        const subareasLider = subareasOndeEhLider.get(membro.id) || []
        for (const subareaId of subareasLider) {
            for (const outroMembro of membrosAtivos) {
                if (outroMembro.isLiderSubarea && outroMembro.subareaId === subareaId && outroMembro.id !== membro.id) {
                    membrosAvaliadosIds.add(outroMembro.id)
                }
            }
        }

        for (const avaliadoId of membrosAvaliadosIds) {
            pares.add(`${membro.id}-${avaliadoId}`)
        }
    }

    return Array.from(pares).map(par => {
        const [avaliadorId, avaliadoId] = par.split('-').map(Number)
        return { avaliadorId, avaliadoId }
    })
}

export async function getPreviewAvaliacao360(idCiclo: number) {
    try {
        const pares = await gerarParesAvaliacao360(idCiclo);
        
        const membrosAtivos = await prisma.membro.findMany({
            where: { isAtivo: true },
            include: { area: true },
        });
        
        const membrosMap = new Map(membrosAtivos.map(m => [m.id, m]));
        
        const grouped = new Map<number, any>();
        
        for (const m of membrosAtivos) {
            grouped.set(m.id, {
                id: m.id,
                nome: m.nome,
                area: m.area.nome,
                fotoUrl: m.fotoUrl,
                isCoordenador: m.isCoordenador,
                avaliaQuem: []
            });
        }
        
        for (const par of pares) {
            const avaliador = grouped.get(par.avaliadorId);
            const avaliado = membrosMap.get(par.avaliadoId);
            if (avaliador && avaliado) {
                avaliador.avaliaQuem.push({
                    id: avaliado.id,
                    nome: avaliado.nome,
                    area: avaliado.area.nome,
                    fotoUrl: avaliado.fotoUrl
                });
            }
        }
        
        return Array.from(grouped.values()).filter(g => g.avaliaQuem.length > 0).sort((a, b) => {
            if (a.isCoordenador !== b.isCoordenador) return a.isCoordenador ? -1 : 1;
            if (a.area !== b.area) return a.area.localeCompare(b.area);
            return a.nome.localeCompare(b.nome);
        });
    } catch (error) {
        console.error(error);
        return [];
    }
}

export async function getMembrosAtivosBasico() {
    try {
        const membros = await prisma.membro.findMany({
            where: { isAtivo: true },
            select: { id: true, nome: true, fotoUrl: true, area: { select: { nome: true } } },
            orderBy: [{ area: { nome: 'asc' } }, { nome: 'asc' }]
        })
        return membros.map(m => ({ id: m.id, nome: m.nome, fotoUrl: m.fotoUrl, area: m.area.nome }))
    } catch (error) {
        console.error(error)
        return []
    }
}

export async function vincularCicloAvaliacao360(avaliacaoId: number, idCiclo: number) {
    try {
        await prisma.avaliacao360.update({
            where: { id: avaliacaoId },
            data: { idCiclo }
        })
        return { success: true }
    } catch (error) {
        console.error(error)
        return { success: false, error: "Erro ao vincular ciclo" }
    }
}

export async function ativarAvaliacao360(id: number, customPares?: Array<{avaliadorId: number, avaliadoId: number}>) {
    try {
        const avaliacao = await prisma.avaliacao360.findUnique({
            where: { id }
        })

        if (!avaliacao) {
            return { success: false, error: "Avaliação não encontrada" }
        }

        let pares: Array<{avaliadorId: number, avaliadoId: number}>
        if (customPares && customPares.length > 0) {
            pares = customPares
        } else {
            if (!avaliacao.idCiclo) {
                return { success: false, error: "Avaliação sem ciclo associado" }
            }
            pares = await gerarParesAvaliacao360(avaliacao.idCiclo)
        }

        await prisma.$transaction(async (tx) => {
            if (pares.length > 0) {
                await tx.feedback360.createMany({
                    data: pares.map(p => ({
                        avaliacaoId: id,
                        avaliadorId: p.avaliadorId,
                        avaliadoId: p.avaliadoId,
                        finalizado: false
                    })),
                    skipDuplicates: true
                })
            }

            await tx.avaliacao360.update({
                where: { id },
                data: { status: StatusAvaliacao360.ATIVA, dataInicio: new Date() }
            })
        })

        revalidatePath('/coord/avaliacoes-360')
        revalidatePath('/coord/avaliacoes-360/[id]', 'page')
        return { success: true }
    } catch (error) {
        console.error(error)
        return { success: false, error: "Erro ao ativar" }
    }
}

export async function encerrarAvaliacao360(id: number) {
    try {
        await prisma.avaliacao360.update({
            where: { id },
            data: { status: StatusAvaliacao360.ENCERRADA, dataFim: new Date() }
        })
        revalidatePath('/coord/avaliacoes-360')
        revalidatePath('/coord/avaliacoes-360/[id]', 'page')
        return { success: true }
    } catch (error) {
        console.error(error)
        return { success: false, error: "Erro ao encerrar" }
    }
}

export type SaveAvaliacaoFullPayload = {
    nome: string;
    pesoGeralCalculado?: number;
    dimensoes: Array<{
        id?: number;
        titulo: string;
        perguntas: Array<{
            id?: number;
            texto: string;
            tipo: TipoPergunta360;
            obrigatoria: boolean;
        }>
    }>
}

export async function salvarRascunhoAvaliacao360(avaliacaoId: number, data: SaveAvaliacaoFullPayload) {
    try {
        await prisma.$transaction(async (tx) => {
            await tx.avaliacao360.update({
                where: { id: avaliacaoId },
                data: { nome: data.nome }
            })

            await tx.dimensao360.deleteMany({
                where: { avaliacaoId }
            })

            for (let i = 0; i < data.dimensoes.length; i++) {
                const dim = data.dimensoes[i]

                const createdDim = await tx.dimensao360.create({
                    data: {
                        avaliacaoId,
                        titulo: dim.titulo,
                        ordem: i,
                    }
                })

                if (dim.perguntas && dim.perguntas.length > 0) {
                    await tx.pergunta360.createMany({
                        data: dim.perguntas.map((perg, j) => ({
                            dimensaoId: createdDim.id,
                            texto: perg.texto,
                            tipo: perg.tipo,
                            obrigatoria: perg.obrigatoria,
                            ordem: j
                        }))
                    })
                }
            }
        })

        revalidatePath('/coord/avaliacoes-360/[id]/editar', 'page')
        return { success: true }
    } catch (error) {
        console.error(error)
        return { success: false, error: "Erro ao salvar rascunho completo" }
    }
}

export async function getMinhas360Pendentes(membroId: number) {
    try {
        const feedbacks = await prisma.feedback360.findMany({
            where: {
                avaliadorId: membroId,
                finalizado: false,
                avaliacao: {
                    status: StatusAvaliacao360.ATIVA
                }
            },
            include: {
                avaliado: {
                    include: {
                        area: true
                    }
                },
                avaliacao: {
                    include: {
                        dimensoes: {
                            include: {
                                perguntas: true
                            }
                        }
                    }
                },
                respostas: true
            }
        })

        return feedbacks.map(f => {
            const totalObrigatorias = f.avaliacao.dimensoes.flatMap(d => d.perguntas).filter(p => p.obrigatoria).length;
            const perguntasObrigatoriasIds = new Set(f.avaliacao.dimensoes.flatMap(d => d.perguntas).filter(p => p.obrigatoria).map(p => p.id));
            const respostasValidas = f.respostas.filter(r => perguntasObrigatoriasIds.has(r.perguntaId) && (r.nota !== null || (r.texto && r.texto.trim() !== ''))).length;

            return {
                id: f.id,
                avaliacaoId: f.avaliacaoId,
                avaliacaoNome: f.avaliacao.nome,
                avaliadoNome: f.avaliado.nome,
                avaliadoFoto: f.avaliado.fotoUrl,
                avaliadoArea: f.avaliado.area.nome,
                progresso: totalObrigatorias > 0 ? Math.round((respostasValidas / totalObrigatorias) * 100) : 100
            }
        });
    } catch (error) {
        console.error(error)
        return []
    }
}

export async function getFeedback360MatrixParaResponder(avaliacaoId: number, membroId: number) {
    try {
        const feedbacks = await prisma.feedback360.findMany({
            where: {
                avaliacaoId: avaliacaoId,
                avaliadorId: membroId,
                finalizado: false,
                avaliacao: {
                    status: StatusAvaliacao360.ATIVA
                }
            },
            include: {
                avaliado: {
                    include: {
                        area: true
                    }
                },
                avaliacao: {
                    include: {
                        dimensoes: {
                            include: {
                                perguntas: {
                                    orderBy: { ordem: 'asc' }
                                }
                            },
                            orderBy: { ordem: 'asc' }
                        }
                    }
                },
                respostas: true
            }
        })

        if (!feedbacks || feedbacks.length === 0) {
            throw new Error("Nenhum feedback pendente encontrado para esta avaliação");
        }

        return feedbacks;
    } catch (error) {
        console.error(error)
        throw error;
    }
}

export async function salvarRespostas360(feedbackId: number, membroId: number, respostas: Array<{perguntaId: number, nota?: number, texto?: string}>) {
    try {
        const feedback = await prisma.feedback360.findUnique({
            where: { id: feedbackId },
            include: { avaliacao: true }
        });

        if (!feedback || feedback.avaliadorId !== membroId) {
            return { success: false, error: "Sem permissão" };
        }

        if (feedback.avaliacao.status !== StatusAvaliacao360.ATIVA || feedback.finalizado) {
            return { success: false, error: "Feedback já finalizado ou avaliação inativa" };
        }

        await prisma.$transaction(async (tx) => {
            for (const r of respostas) {
                const dataToSave: any = {
                    feedbackId,
                    perguntaId: r.perguntaId,
                }
                if (r.nota !== undefined) dataToSave.nota = r.nota;
                if (r.texto !== undefined) dataToSave.texto = r.texto;

                await tx.respostaPergunta360.upsert({
                    where: {
                        feedbackId_perguntaId: {
                            feedbackId,
                            perguntaId: r.perguntaId
                        }
                    },
                    update: dataToSave,
                    create: dataToSave
                });
            }
        });

        return { success: true };
    } catch (error) {
        console.error(error)
        return { success: false, error: "Erro ao salvar respostas" };
    }
}

export async function finalizarFeedback360(feedbackId: number, membroId: number) {
    try {
        const feedback = await prisma.feedback360.findUnique({
            where: { id: feedbackId },
            include: {
                avaliacao: {
                    include: {
                        dimensoes: {
                            include: {
                                perguntas: true
                            }
                        }
                    }
                },
                respostas: true
            }
        });

        if (!feedback || feedback.avaliadorId !== membroId) {
            return { success: false, error: "Sem permissão" };
        }

        if (feedback.avaliacao.status !== StatusAvaliacao360.ATIVA || feedback.finalizado) {
            return { success: false, error: "Feedback já finalizado ou avaliação inativa" };
        }

        const respostasMap = new Map(feedback.respostas.map(r => [r.perguntaId, r]));

        const perguntas = feedback.avaliacao.dimensoes.flatMap(d => d.perguntas);
        for (const p of perguntas) {
            if (p.obrigatoria) {
                const resp = respostasMap.get(p.id);
                if (!resp) {
                    return { success: false, error: "Preencha todas as respostas obrigatórias" };
                }
                if (p.tipo === TipoPergunta360.ESCALA) {
                    if (resp.nota === null || resp.nota < 1 || resp.nota > 10) {
                        return { success: false, error: "Preencha todas as respostas obrigatórias com notas válidas" };
                    }
                } else if (p.tipo === TipoPergunta360.TEXTO_ABERTO) {
                    if (!resp.texto || resp.texto.trim() === '') {
                        return { success: false, error: "Preencha todos os campos de texto obrigatórios" };
                    }
                }
            }
        }

        await prisma.feedback360.update({
            where: { id: feedbackId },
            data: { finalizado: true }
        });

        revalidatePath('/avaliacoes-360');
        return { success: true };
    } catch (error) {
        console.error(error)
        return { success: false, error: "Erro ao finalizar feedback" };
    }
}

export async function temAvaliacao360Pendente(membroId: number) {
    try {
        const pendente = await prisma.feedback360.findFirst({
            where: {
                avaliadorId: membroId,
                finalizado: false,
                avaliacao: {
                    status: StatusAvaliacao360.ATIVA
                }
            }
        });
        return !!pendente;
    } catch (error) {
        console.error(error);
        return false;
    }
}

export interface Av360RespostasView {
    avaliacaoId: number
    avaliacaoNome: string
    dataFim: Date | null
    avaliados: {
        feedbackId: number
        avaliadoId: number
        avaliadoNome: string
        dimensoes: {
            id: number
            titulo: string
            perguntas: {
                id: number
                texto: string
                tipo: "ESCALA" | "TEXTO_ABERTO"
                ordem: number
                resposta: { nota: number | null; texto: string | null } | null
            }[]
        }[]
    }[]
}

export async function getAv360RespostasForMembro(
    membroId: number,
    avaliacaoId: number
): Promise<Av360RespostasView | null> {
    const feedbacks = await prisma.feedback360.findMany({
        where: { avaliadorId: membroId, avaliacaoId, finalizado: true },
        include: {
            avaliado: { select: { id: true, nome: true } },
            respostas: true,
            avaliacao: {
                select: {
                    id: true,
                    nome: true,
                    dataFim: true,
                    dimensoes: {
                        orderBy: { ordem: "asc" },
                        include: {
                            perguntas: { orderBy: { ordem: "asc" } },
                        },
                    },
                },
            },
        },
    })

    if (feedbacks.length === 0) return null

    const av = feedbacks[0].avaliacao

    return {
        avaliacaoId: av.id,
        avaliacaoNome: av.nome,
        dataFim: av.dataFim,
        avaliados: feedbacks.map((f: any) => ({
            feedbackId: f.id,
            avaliadoId: f.avaliado.id,
            avaliadoNome: f.avaliado.nome,
            dimensoes: av.dimensoes.map((d: any) => ({
                id: d.id,
                titulo: d.titulo,
                perguntas: d.perguntas.map((p: any) => {
                    const resposta = f.respostas.find((r: any) => r.perguntaId === p.id) ?? null
                    return {
                        id: p.id,
                        texto: p.texto,
                        tipo: p.tipo,
                        ordem: p.ordem,
                        resposta: resposta ? { nota: resposta.nota, texto: resposta.texto } : null,
                    }
                }),
            })),
        })),
    }
}

export interface Av360HistoricoItem {
    avaliacaoId: number
    avaliacaoNome: string
    totalAvaliados: number
    dataFim: Date | null
}

export async function getAv360HistoricoMembro(membroId: number): Promise<Av360HistoricoItem[]> {
    const feedbacks = await prisma.feedback360.findMany({
        where: { avaliadorId: membroId, finalizado: true },
        include: {
            avaliacao: { select: { id: true, nome: true, dataFim: true } },
        },
    })

    const porAvaliacao = new Map<number, Av360HistoricoItem>()
    for (const f of feedbacks) {
        const existing = porAvaliacao.get(f.avaliacaoId)
        if (existing) {
            existing.totalAvaliados++
        } else {
            porAvaliacao.set(f.avaliacaoId, {
                avaliacaoId: f.avaliacaoId,
                avaliacaoNome: f.avaliacao.nome,
                totalAvaliados: 1,
                dataFim: f.avaliacao.dataFim,
            })
        }
    }

    return Array.from(porAvaliacao.values()).sort((a, b) =>
        (b.dataFim?.getTime() ?? 0) - (a.dataFim?.getTime() ?? 0)
    )
}

export async function getRelatorio360PorAvaliado(avaliacaoId: number, avaliadoId: number) {
    try {
        const avaliacao = await prisma.avaliacao360.findUnique({
            where: { id: avaliacaoId },
            include: {
                dimensoes: {
                    include: {
                        perguntas: true
                    }
                }
            }
        });

        if (!avaliacao) throw new Error("Avaliação não encontrada");

        const feedbacks = await prisma.feedback360.findMany({
            where: {
                avaliacaoId,
                avaliadoId,
                finalizado: true
            },
            include: {
                respostas: true
            }
        });

        const numRespondentes = feedbacks.length;
        if (numRespondentes === 0) {
            return {
                numRespondentes: 0,
                scoreGeral: 0,
                dimensoes: [],
                comentarios: []
            };
        }

        const respostasPorPergunta = new Map<number, any[]>();
        for (const f of feedbacks) {
            for (const r of f.respostas) {
                if (!respostasPorPergunta.has(r.perguntaId)) {
                    respostasPorPergunta.set(r.perguntaId, []);
                }
                respostasPorPergunta.get(r.perguntaId)!.push(r);
            }
        }

        const relatorioDimensoes: any[] = [];
        const comentarios: { pergunta: string; respostas: string[] }[] = [];
        let somaScoreGeral = 0;
        let somaPesosTotal = 0;

        for (const dim of avaliacao.dimensoes) {
            let somaNotasDimensao = 0;
            let totalNotasDimensao = 0;
            const distribuicaoDimensao = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0, 10: 0 };

            for (const perg of dim.perguntas) {
                const respostas = respostasPorPergunta.get(perg.id) || [];
                
                if (perg.tipo === TipoPergunta360.ESCALA) {
                    for (const r of respostas) {
                        if (r.nota) {
                            somaNotasDimensao += r.nota;
                            totalNotasDimensao++;
                            distribuicaoDimensao[r.nota as keyof typeof distribuicaoDimensao]++;
                        }
                    }
                } else if (perg.tipo === TipoPergunta360.TEXTO_ABERTO) {
                    const textos = respostas.filter(r => r.texto && r.texto.trim() !== "").map(r => r.texto as string);
                    if (textos.length > 0) {
                        comentarios.push({
                            pergunta: perg.texto,
                            respostas: textos
                        });
                    }
                }
            }

            const mediaSimples = totalNotasDimensao > 0 ? somaNotasDimensao / totalNotasDimensao : 0;

            somaScoreGeral += mediaSimples;
            somaPesosTotal += 1;

            relatorioDimensoes.push({
                dimensao: dim.titulo,
                mediaSimples,
                distribuicao: distribuicaoDimensao
            });
        }

        const scoreGeralFinal = somaPesosTotal > 0 ? somaScoreGeral / somaPesosTotal : 0;

        return {
            numRespondentes,
            scoreGeral: Number(scoreGeralFinal.toFixed(2)),
            dimensoes: relatorioDimensoes.map(d => ({ ...d, mediaSimples: Number(d.mediaSimples.toFixed(2)) })),
            comentarios
        };
    } catch (error) {
        console.error(error);
        return null;
    }
}

export async function getRelatorioAV360(avaliacaoId: number): Promise<AV360ReportData | null> {
  try {
    const [geral, avaliacao, metaCurada] = await Promise.all([
      getRelatorio360Geral(avaliacaoId),
      prisma.avaliacao360.findUnique({
        where: { id: avaliacaoId },
        select: { nome: true, dimensoes: { select: { id: true } } },
      }),
      (prisma as any).relatorioAV360Meta.findUnique({ where: { avaliacaoId } }),
    ]);

    if (!geral || !avaliacao) return null;

    const membrosDetalhes: AV360MembroDetalhes[] = await Promise.all(
      geral.ranking.map(async (r: any) => {
        const detalhes = await getRelatorio360PorAvaliado(avaliacaoId, r.membroId);
        return {
          membroId: r.membroId,
          nome: r.nome,
          scoreGeral: r.scoreGeral,
          numRespondentes: detalhes?.numRespondentes ?? 0,
          dimensoes: (detalhes?.dimensoes ?? []).map((d: any) => ({
            dimensao: d.dimensao,
            mediaSimples: d.mediaSimples,
            distribuicao: d.distribuicao,
          })),
          comentarios: detalhes?.comentarios ?? [],
        };
      })
    );

    return {
      avaliacaoId,
      nome: avaliacao.nome,
      scoreGlobalMedia: geral.scoreGlobalMedia,
      ranking: geral.ranking,
      dimensoesGlobais: geral.dimensoesGlobais,
      membrosDetalhes,
      meta: {
        capaTitulo: metaCurada?.capaTitulo ?? null,
        objetivo: metaCurada?.objetivo ?? null,
        conclusao: metaCurada?.conclusao ?? null,
      },
    };
  } catch (error) {
    console.error(error);
    return null;
  }
}

export interface SalvarRelatorioAV360Payload {
  meta?: {
    capaTitulo?: string;
    objetivo?: string;
    conclusao?: string;
  };
}

export async function salvarRelatorioAV360(
  avaliacaoId: number,
  payload: SalvarRelatorioAV360Payload
): Promise<{ success: boolean; error?: string }> {
  try {
    if (payload.meta) {
      await (prisma as any).relatorioAV360Meta.upsert({
        where: { avaliacaoId },
        update: {
          capaTitulo: payload.meta.capaTitulo ?? null,
          objetivo: payload.meta.objetivo ?? null,
          conclusao: payload.meta.conclusao ?? null,
        },
        create: {
          avaliacaoId,
          capaTitulo: payload.meta.capaTitulo ?? null,
          objetivo: payload.meta.objetivo ?? null,
          conclusao: payload.meta.conclusao ?? null,
        },
      });
    }
    return { success: true };
  } catch (error: any) {
    console.error(error);
    return { success: false, error: error.message || "Erro ao salvar relatório." };
  }
}

export async function getRelatorio360Geral(avaliacaoId: number) {
    try {
        const avaliacao = await prisma.avaliacao360.findUnique({
            where: { id: avaliacaoId },
            include: {
                dimensoes: {
                    include: {
                        perguntas: true
                    }
                }
            }
        });

        if (!avaliacao) throw new Error("Avaliação não encontrada");

        const feedbacks = await prisma.feedback360.findMany({
            where: { avaliacaoId, finalizado: true },
            include: { respostas: true, avaliado: true }
        });

        const avaliadosSet = new Set(feedbacks.map(f => f.avaliadoId));
        const ranking: any[] = [];
        
        let somaGlobalScore = 0;
        let qtdGlobalScores = 0;
        const mediasPorDimensaoGlobal = new Map<number, { soma: number, count: number }>();

        for (const avaliadoId of avaliadosSet) {
            const fbAvaliado = feedbacks.filter(f => f.avaliadoId === avaliadoId);
            const membro = fbAvaliado[0].avaliado;
            
            const respostasPorPergunta = new Map<number, any[]>();
            for (const f of fbAvaliado) {
                for (const r of f.respostas) {
                    if (!respostasPorPergunta.has(r.perguntaId)) {
                        respostasPorPergunta.set(r.perguntaId, []);
                    }
                    respostasPorPergunta.get(r.perguntaId)!.push(r);
                }
            }

            let somaScore = 0;
            let somaPesos = 0;
            const dimensoesMembro: any[] = [];

            for (const dim of avaliacao.dimensoes) {
                let somaNotas = 0;
                let totalNotas = 0;

                for (const perg of dim.perguntas) {
                    if (perg.tipo === TipoPergunta360.ESCALA) {
                        const respostas = respostasPorPergunta.get(perg.id) || [];
                        for (const r of respostas) {
                            if (r.nota) {
                                somaNotas += r.nota;
                                totalNotas++;
                            }
                        }
                    }
                }

                const mediaDim = totalNotas > 0 ? somaNotas / totalNotas : 0;
                somaScore += mediaDim;
                somaPesos += 1;
                
                if (!mediasPorDimensaoGlobal.has(dim.id)) {
                    mediasPorDimensaoGlobal.set(dim.id, { soma: 0, count: 0 });
                }
                if (totalNotas > 0) {
                    const md = mediasPorDimensaoGlobal.get(dim.id)!;
                    md.soma += mediaDim;
                    md.count += 1;
                }

                dimensoesMembro.push({ titulo: dim.titulo, media: mediaDim });
            }

            const scoreGeral = somaPesos > 0 ? somaScore / somaPesos : 0;
            if (somaPesos > 0) {
                somaGlobalScore += scoreGeral;
                qtdGlobalScores++;
            }

            ranking.push({
                membroId: membro.id,
                nome: membro.nome,
                fotoUrl: membro.fotoUrl,
                scoreGeral: Number(scoreGeral.toFixed(2)),
                dimensoes: dimensoesMembro.map(d => ({ ...d, media: Number(d.media.toFixed(2)) }))
            });
        }

        ranking.sort((a, b) => b.scoreGeral - a.scoreGeral);

        const dimensoesGlobais = avaliacao.dimensoes.map(d => {
            const stats = mediasPorDimensaoGlobal.get(d.id);
            const media = stats && stats.count > 0 ? stats.soma / stats.count : 0;
            return {
                titulo: d.titulo,
                mediaGlobal: Number(media.toFixed(2))
            };
        });

        const scoreGlobalMedia = qtdGlobalScores > 0 ? somaGlobalScore / qtdGlobalScores : 0;

        return {
            scoreGlobalMedia: Number(scoreGlobalMedia.toFixed(2)),
            ranking,
            dimensoesGlobais
        };
    } catch (error) {
        console.error(error);
        return null;
    }
}

// ─── AV360 XLSX Export ────────────────────────────────────────────────────────

function stdDev(values: number[]): number {
    if (values.length < 2) return 0;
    const mean = values.reduce((s, v) => s + v, 0) / values.length;
    const variance = values.reduce((s, v) => s + (v - mean) ** 2, 0) / values.length;
    return Math.sqrt(variance);
}

export interface AV360XlsxMembro {
    membroId: number;
    nome: string;
    area: string;
    isCoordenador: boolean;
    scoreGeral: number;
    numRespondentes: number;
    dimensoes: Array<{
        titulo: string;
        media: number;
        desvio: number;
        criterios: Array<{
            texto: string;
            media: number;
            desvio: number;
            discrepancia: number;
        }>;
    }>;
    pontosFortes: string[];
    pontosDesenvolver: string[];
}

export interface AV360XlsxData {
    avaliacaoId: number;
    nome: string;
    dimensoesTitulos: string[];
    membros: AV360XlsxMembro[];
    destaque?: string;
}

export async function getRelatorioAV360XlsxData(avaliacaoId: number): Promise<AV360XlsxData | null> {
    try {
        const avaliacao = await prisma.avaliacao360.findUnique({
            where: { id: avaliacaoId },
            include: {
                dimensoes: {
                    orderBy: { ordem: "asc" },
                    include: {
                        perguntas: {
                            orderBy: { ordem: "asc" }
                        }
                    }
                }
            }
        });

        if (!avaliacao) return null;

        const feedbacks = await prisma.feedback360.findMany({
            where: { avaliacaoId, finalizado: true },
            include: {
                respostas: true,
                avaliado: {
                    include: { area: true }
                }
            }
        });

        // Collect TEXTO_ABERTO pergunta ids in order (across all dimensions)
        const textoAbertoIds: number[] = [];
        for (const dim of avaliacao.dimensoes) {
            for (const perg of dim.perguntas) {
                if (perg.tipo === TipoPergunta360.TEXTO_ABERTO) {
                    textoAbertoIds.push(perg.id);
                }
            }
        }

        const avaliadosSet = new Set(feedbacks.map(f => f.avaliadoId));
        const membros: AV360XlsxMembro[] = [];

        for (const avaliadoId of avaliadosSet) {
            const fbAvaliado = feedbacks.filter(f => f.avaliadoId === avaliadoId);
            const membroInfo = fbAvaliado[0].avaliado;

            // Separate self-assessment from peer feedbacks
            const selfFb = fbAvaliado.find(f => f.avaliadorId === avaliadoId);
            const peerFbs = fbAvaliado.filter(f => f.avaliadorId !== avaliadoId);
            const numRespondentes = peerFbs.length;

            // Build peer map: perguntaId -> peer notas
            const peerNotasPorPergunta = new Map<number, number[]>();
            const textosPorPergunta = new Map<number, { nota: number | null; texto: string | null }[]>();
            for (const f of peerFbs) {
                for (const r of f.respostas) {
                    if (r.nota !== null) {
                        if (!peerNotasPorPergunta.has(r.perguntaId)) peerNotasPorPergunta.set(r.perguntaId, []);
                        peerNotasPorPergunta.get(r.perguntaId)!.push(r.nota);
                    }
                    if (!textosPorPergunta.has(r.perguntaId)) textosPorPergunta.set(r.perguntaId, []);
                    textosPorPergunta.get(r.perguntaId)!.push({ nota: r.nota, texto: r.texto });
                }
            }

            // Build self map: perguntaId -> self nota
            const selfNotasPorPergunta = new Map<number, number>();
            if (selfFb) {
                for (const r of selfFb.respostas) {
                    if (r.nota !== null) selfNotasPorPergunta.set(r.perguntaId, r.nota);
                }
            }

            // Compute dimension + per-criterion stats
            const dimensoes: AV360XlsxMembro["dimensoes"] = [];
            let somaScoreGeral = 0;

            for (const dim of avaliacao.dimensoes) {
                const criterios: AV360XlsxMembro["dimensoes"][0]["criterios"] = [];
                const notasDim: number[] = [];

                for (const perg of dim.perguntas) {
                    if (perg.tipo === TipoPergunta360.ESCALA) {
                        const peerNotas = peerNotasPorPergunta.get(perg.id) ?? [];
                        const peerMedia = peerNotas.length > 0
                            ? peerNotas.reduce((s, v) => s + v, 0) / peerNotas.length
                            : 0;
                        const peerDesvio = stdDev(peerNotas);
                        const selfNota = selfNotasPorPergunta.get(perg.id);
                        const discrepancia = selfNota !== undefined ? selfNota - peerMedia : 0;
                        notasDim.push(...peerNotas);
                        criterios.push({
                            texto: perg.texto,
                            media: Number(peerMedia.toFixed(2)),
                            desvio: Number(peerDesvio.toFixed(2)),
                            discrepancia: Number(discrepancia.toFixed(2)),
                        });
                    }
                }

                const media = criterios.length > 0
                    ? criterios.reduce((s, c) => s + c.media, 0) / criterios.length
                    : 0;
                const desvio = stdDev(notasDim);
                somaScoreGeral += media;
                dimensoes.push({
                    titulo: dim.titulo,
                    media: Number(media.toFixed(2)),
                    desvio: Number(desvio.toFixed(2)),
                    criterios,
                });
            }

            const scoreGeral = avaliacao.dimensoes.length > 0
                ? Number((somaScoreGeral / avaliacao.dimensoes.length).toFixed(2))
                : 0;

            // Collect text responses
            const pontosFortes: string[] = [];
            const pontosDesenvolver: string[] = [];

            const SPLIT_REGEX = /^(?:pontos?\s+fortes?:\s*)?([\s\S]+?)\s+(?:desenvolvimento|desenvolver|pontos?\s+a\s+desenvolver|pontos?\s+de\s+desenvolvimento):\s*([\s\S]+)$/i;

            function processTextResponse(texto: string) {
                const trimmed = texto.trim();
                const match = trimmed.match(SPLIT_REGEX);
                if (match) {
                    const f = match[1].trim();
                    const d = match[2].trim();
                    if (f) pontosFortes.push(f.charAt(0).toUpperCase() + f.slice(1));
                    if (d) pontosDesenvolver.push(d.charAt(0).toUpperCase() + d.slice(1));
                } else {
                    if (/^(?:desenvolvimento|desenvolver|pontos?\s+a\s+desenvolver|pontos?\s+de\s+desenvolvimento):\s*/i.test(trimmed)) {
                        const dClean = trimmed.replace(/^(?:desenvolvimento|desenvolver|pontos?\s+a\s+desenvolver|pontos?\s+de\s+desenvolvimento):\s*/i, '').trim();
                        if (dClean) pontosDesenvolver.push(dClean.charAt(0).toUpperCase() + dClean.slice(1));
                    } else {
                        const fClean = trimmed.replace(/^(?:pontos?\s+fortes?:\s*)/i, '').trim();
                        if (fClean) pontosFortes.push(fClean.charAt(0).toUpperCase() + fClean.slice(1));
                    }
                }
            }

            if (textoAbertoIds.length >= 2) {
                const firstId = textoAbertoIds[0];
                const secondId = textoAbertoIds[1];
                const respostasFortes = textosPorPergunta.get(firstId) || [];
                for (const r of respostasFortes) {
                    if (r.texto && r.texto.trim()) {
                        processTextResponse(r.texto);
                    }
                }
                const respostasDesenvolver = textosPorPergunta.get(secondId) || [];
                for (const r of respostasDesenvolver) {
                    if (r.texto && r.texto.trim()) {
                        const trimmed = r.texto.trim();
                        const match = trimmed.match(SPLIT_REGEX);
                        if (match) {
                            const f = match[1].trim();
                            const d = match[2].trim();
                            if (f) pontosFortes.push(f.charAt(0).toUpperCase() + f.slice(1));
                            if (d) pontosDesenvolver.push(d.charAt(0).toUpperCase() + d.slice(1));
                        } else {
                            const dClean = trimmed.replace(/^(?:desenvolvimento|desenvolver|pontos?\s+a\s+desenvolver|pontos?\s+de\s+desenvolvimento):\s*/i, '').trim();
                            if (dClean) pontosDesenvolver.push(dClean.charAt(0).toUpperCase() + dClean.slice(1));
                        }
                    }
                }
            } else if (textoAbertoIds.length === 1) {
                const respostas = textosPorPergunta.get(textoAbertoIds[0]) || [];
                for (const r of respostas) {
                    if (r.texto && r.texto.trim()) {
                        processTextResponse(r.texto);
                    }
                }
            }

            function groupAndFormatFeedback(items: string[]): string[] {
                const counts = new Map<string, number>();
                for (const item of items) {
                    const normalized = item.trim();
                    if (!normalized) continue;
                    let foundKey = normalized;
                    for (const key of counts.keys()) {
                        if (key.toLowerCase() === normalized.toLowerCase()) {
                            foundKey = key;
                            break;
                        }
                    }
                    counts.set(foundKey, (counts.get(foundKey) || 0) + 1);
                }
                const formatted = Array.from(counts.entries()).map(([text, count]) => {
                    return count > 1 ? `${text} (${count}x)` : text;
                });
                return formatted.sort((a, b) => a.localeCompare(b, 'pt-BR', { sensitivity: 'base' }));
            }

            membros.push({
                membroId: membroInfo.id,
                nome: membroInfo.nome,
                area: membroInfo.area.nome,
                isCoordenador: membroInfo.isCoordenador,
                scoreGeral,
                numRespondentes,
                dimensoes,
                pontosFortes: groupAndFormatFeedback(pontosFortes),
                pontosDesenvolver: groupAndFormatFeedback(pontosDesenvolver)
            });
        }

        // Sort: area asc, then isCoordenador desc, then nome asc
        membros.sort((a, b) => {
            const areaCmp = a.area.localeCompare(b.area);
            if (areaCmp !== 0) return areaCmp;
            if (a.isCoordenador !== b.isCoordenador) return a.isCoordenador ? -1 : 1;
            return a.nome.localeCompare(b.nome);
        });

        return {
            avaliacaoId,
            nome: avaliacao.nome,
            dimensoesTitulos: avaliacao.dimensoes.map(d => d.titulo),
            membros
        };
    } catch (error) {
        console.error(error);
        return null;
    }
}

export async function gerarRelatorioAV360Xlsx(avaliacaoId: number): Promise<{ bytes: number[]; nome: string } | null> {
    const data = await getRelatorioAV360XlsxData(avaliacaoId);
    if (!data) return null;
    const { generateAV360Xlsx } = await import("@/src/lib/reports/av360/generateAV360Xlsx");
    const buffer = await generateAV360Xlsx(data);
    return { bytes: Array.from(buffer), nome: data.nome };
}

export type Avaliador360Status = {
    membroId: number
    nome: string
    area: string
    totalPares: number
    paresFinalizados: number
    concluiu: boolean
}

export async function getAvaliadores360Status(avaliacaoId: number): Promise<Avaliador360Status[]> {
    try {
        const feedbacks = await prisma.feedback360.findMany({
            where: { avaliacaoId },
            include: {
                avaliador: {
                    include: { area: true }
                }
            }
        })

        const porAvaliador = new Map<number, Avaliador360Status>()

        for (const f of feedbacks) {
            if (!porAvaliador.has(f.avaliadorId)) {
                porAvaliador.set(f.avaliadorId, {
                    membroId: f.avaliadorId,
                    nome: f.avaliador.nome,
                    area: f.avaliador.area.nome,
                    totalPares: 0,
                    paresFinalizados: 0,
                    concluiu: false
                })
            }
            const entry = porAvaliador.get(f.avaliadorId)!
            entry.totalPares++
            if (f.finalizado) entry.paresFinalizados++
        }

        for (const entry of porAvaliador.values()) {
            entry.concluiu = entry.totalPares > 0 && entry.paresFinalizados === entry.totalPares
        }

        return Array.from(porAvaliador.values()).sort((a, b) => {
            if (a.area !== b.area) return a.area.localeCompare(b.area)
            return a.nome.localeCompare(b.nome)
        })
    } catch (error) {
        console.error(error)
        return []
    }
}
