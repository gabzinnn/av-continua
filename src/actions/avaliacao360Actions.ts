// npx prisma migrate dev --name add_avaliacao_360
// npx prisma generate
"use server"

import prisma from "@/src/lib/prisma"
import { revalidatePath } from "next/cache"
import { StatusAvaliacao360, TipoPergunta360 } from "@/src/generated/prisma/client"

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

