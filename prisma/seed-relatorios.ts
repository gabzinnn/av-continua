/**
 * Seed de dados para testar relatórios de PCO e AV360.
 * Usa exclusivamente membros e áreas já cadastrados no banco.
 *
 * Uso:
 *   npx tsx prisma/seed-relatorios.ts
 *
 * O script é idempotente: limpa dados anteriores pelo nome antes de recriar.
 */

import { PrismaClient, StatusPCO, StatusAvaliacao360, TipoPerguntaPCO, TipoPergunta360 } from "../src/generated/prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import * as dotenv from "dotenv"

dotenv.config({ path: ".env.local" })
dotenv.config({ path: ".env" })

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter } as any)

const PCO_NOME = "PCO Mock - Teste de Relatório"
const AV360_NOME = "AV360 Mock - Teste de Relatório"

// DREs dos membros mock criados por versões anteriores do seed
const MOCK_DRES = [
  "120001111", "120001112", "120001113",
  "120002221", "120002222", "120002223",
  "120003331", "120003332", "120003333",
  "120004441", "120004442", "120004443",
]

function randomBetween(min: number, max: number, decimals = 1): number {
  return parseFloat((Math.random() * (max - min) + min).toFixed(decimals))
}

function pickRandom<T>(arr: T[], n: number): T[] {
  return [...arr].sort(() => Math.random() - 0.5).slice(0, n)
}

async function main() {
  console.log("🌱 Iniciando seed de relatórios PCO + AV360...\n")

  // ─── 1. Buscar ciclo ativo ────────────────────────────────────────────────

  const ciclo = await prisma.ciclo.findFirst({
    where: { ativo: true },
    orderBy: { id: "desc" },
  })

  if (!ciclo) {
    throw new Error("Nenhum ciclo ativo encontrado. Crie um ciclo antes de rodar o seed.")
  }

  console.log(`✓ Ciclo: ${ciclo.nome} (id=${ciclo.id})`)

  // ─── 2. Limpar membros mock de versões anteriores ─────────────────────────

  const mockMembros = await prisma.membro.findMany({
    where: { dre: { in: MOCK_DRES } },
  })

  if (mockMembros.length > 0) {
    console.log(`  ♻️  Removendo ${mockMembros.length} membros mock antigos...`)
    const mockIds = mockMembros.map(m => m.id)
    await prisma.participacaoPCO.deleteMany({ where: { membroId: { in: mockIds } } })
    await prisma.respostaPCO.deleteMany({ where: { membroId: { in: mockIds } } })
    await prisma.feedback360.deleteMany({ where: { avaliadorId: { in: mockIds } } })
    await prisma.feedback360.deleteMany({ where: { avaliadoId: { in: mockIds } } })
    await prisma.membro.deleteMany({ where: { id: { in: mockIds } } })
  }

  // ─── 3. Buscar áreas e membros reais (após limpeza dos mocks) ───────────

  const areas = await prisma.area.findMany({
    include: { membros: { where: { isAtivo: true } } },
    orderBy: { nome: "asc" },
  })

  const todosMembros = areas.flatMap(a => a.membros)

  if (areas.length === 0) {
    throw new Error("Nenhuma área encontrada. Cadastre as áreas antes de rodar o seed.")
  }
  if (todosMembros.length === 0) {
    throw new Error("Nenhum membro ativo encontrado. Cadastre os membros antes de rodar o seed.")
  }

  console.log(`✓ Áreas: ${areas.map(a => `${a.nome} (${a.membros.length} membros)`).join(", ")}`)
  console.log(`✓ Total de membros ativos: ${todosMembros.length}\n`)

  // ─── 4. Limpar PCO mock anterior ──────────────────────────────────────────

  const pcoExistente = await prisma.pCO.findFirst({ where: { nome: PCO_NOME } })
  if (pcoExistente) {
    await prisma.pCO.delete({ where: { id: pcoExistente.id } })
    console.log("  ♻️  PCO anterior removida")
  }

  // ─── 5. Limpar AV360 mock anterior ────────────────────────────────────────

  const av360Existente = await prisma.avaliacao360.findFirst({ where: { nome: AV360_NOME } })
  if (av360Existente) {
    await prisma.avaliacao360.delete({ where: { id: av360Existente.id } })
    console.log("  ♻️  AV360 anterior removida")
  }

  // ============================================================
  // 5. PCO
  // ============================================================
  console.log("\n📋 Criando PCO...")

  const pco = await prisma.pCO.create({
    data: {
      nome: PCO_NOME,
      descricao: "Pesquisa de clima organizacional para testar o relatório PDF.",
      status: StatusPCO.ENCERRADA,
      dataInicio: new Date("2025-03-01"),
      dataFim: new Date("2025-03-15"),
      anonima: true,
      idCiclo: ciclo.id,
      secoes: {
        create: [
          {
            titulo: "Cultura e Valores",
            descricao: "Avalie aspectos da cultura organizacional do clube.",
            ordem: 1,
            perguntas: {
              create: [
                {
                  texto: "O clube tem uma cultura de feedback aberto e honesto.",
                  tipo: TipoPerguntaPCO.ESCALA,
                  obrigatoria: true,
                  mostrarJustificativa: true,
                  ordem: 1,
                },
                {
                  texto: "Os valores do clube são vividos no dia a dia pelas lideranças.",
                  tipo: TipoPerguntaPCO.ESCALA,
                  obrigatoria: true,
                  mostrarJustificativa: false,
                  ordem: 2,
                },
                {
                  texto: "Me sinto respeitado(a) e incluído(a) no ambiente do clube.",
                  tipo: TipoPerguntaPCO.ESCALA,
                  obrigatoria: true,
                  mostrarJustificativa: false,
                  ordem: 3,
                },
              ],
            },
          },
          {
            titulo: "Desenvolvimento e Aprendizado",
            descricao: "Avalie as oportunidades de crescimento profissional.",
            ordem: 2,
            perguntas: {
              create: [
                {
                  texto: "O clube oferece oportunidades reais de aprendizado e desenvolvimento.",
                  tipo: TipoPerguntaPCO.ESCALA,
                  obrigatoria: true,
                  mostrarJustificativa: true,
                  ordem: 1,
                },
                {
                  texto: "Meu gestor/coordenador contribui para o meu desenvolvimento.",
                  tipo: TipoPerguntaPCO.ESCALA,
                  obrigatoria: true,
                  mostrarJustificativa: false,
                  ordem: 2,
                },
                {
                  texto: "Qual aspecto de desenvolvimento você mais valoriza no clube?",
                  tipo: TipoPerguntaPCO.MULTIPLA_ESCOLHA,
                  obrigatoria: true,
                  mostrarJustificativa: false,
                  ordem: 3,
                  opcoes: {
                    create: [
                      { texto: "Projetos com clientes reais", ordem: 1 },
                      { texto: "Capacitações e treinamentos", ordem: 2 },
                      { texto: "Mentoria da liderança", ordem: 3 },
                      { texto: "Networking com profissionais", ordem: 4 },
                    ],
                  },
                },
              ],
            },
          },
          {
            titulo: "Comunicação e Gestão",
            descricao: "Avalie a qualidade da comunicação interna e da gestão.",
            ordem: 3,
            perguntas: {
              create: [
                {
                  texto: "As decisões importantes são comunicadas de forma clara e transparente.",
                  tipo: TipoPerguntaPCO.ESCALA,
                  obrigatoria: true,
                  mostrarJustificativa: true,
                  ordem: 1,
                },
                {
                  texto: "Os processos e fluxos de trabalho do clube são bem definidos.",
                  tipo: TipoPerguntaPCO.ESCALA,
                  obrigatoria: true,
                  mostrarJustificativa: false,
                  ordem: 2,
                },
                {
                  texto: "Deixe um comentário geral sobre o clube (opcional):",
                  tipo: TipoPerguntaPCO.TEXTO_LIVRE,
                  obrigatoria: false,
                  mostrarJustificativa: false,
                  ordem: 3,
                },
              ],
            },
          },
        ],
      },
    },
    include: {
      secoes: {
        include: { perguntas: { include: { opcoes: true } } },
        orderBy: { ordem: "asc" },
      },
    },
  })

  // Adicionar participações dos membros reais
  await prisma.participacaoPCO.createMany({
    data: todosMembros.map(m => ({ pcoId: pco.id, membroId: m.id, respondeu: true })),
    skipDuplicates: true,
  })

  // Gerar respostas realistas
  const escalasGood = [2, 2, 1, 2, 1, 2, 2, 1]
  const escalasOk   = [1, 1, 2, -1, 1, 1, 2, 1]
  const escalasLow  = [-1, 1, -1, -2, -1, 1, -1, 1]

  const justificativas = [
    "Poderia melhorar a frequência dos feedbacks.",
    "Sinto que faltam mais momentos estruturados.",
    "Os líderes poderiam ser mais presentes.",
    "Muito bom o ambiente geral do clube!",
    "Às vezes a comunicação é demorada.",
    "Gostaria de mais treinamentos práticos.",
  ]

  const textosLivres = [
    "O clube tem crescido muito e estou animado(a) com o futuro.",
    "Sugiro mais encontros presenciais entre as áreas.",
    "A cultura do clube é ótima, mas poderíamos formalizar melhor os processos.",
    "Estou muito satisfeito(a) com minha experiência aqui.",
  ]

  const opcoesMC = [0, 1, 2, 3, 0, 1, 2, 0, 1, 3, 2, 1]

  for (let i = 0; i < todosMembros.length; i++) {
    const membro = todosMembros[i]
    const isCoord = membro.isCoordenador
    const respostas = []

    for (const secao of pco.secoes) {
      for (const pergunta of secao.perguntas) {
        if (pergunta.tipo === "ESCALA") {
          const pool = isCoord ? escalasGood : (i % 3 === 0 ? escalasLow : escalasOk)
          const nota = pool[i % pool.length]
          const justificativa = pergunta.mostrarJustificativa
            ? justificativas[i % justificativas.length]
            : null
          respostas.push({ perguntaId: pergunta.id, membroId: membro.id, pcoId: pco.id, nota, justificativa })
        } else if (pergunta.tipo === "MULTIPLA_ESCOLHA" && pergunta.opcoes.length > 0) {
          const opcao = pergunta.opcoes[opcoesMC[i % opcoesMC.length] % pergunta.opcoes.length]
          respostas.push({ perguntaId: pergunta.id, membroId: membro.id, pcoId: pco.id, opcaoId: opcao.id })
        } else if (pergunta.tipo === "TEXTO_LIVRE" && !pergunta.obrigatoria && i % 2 === 0) {
          respostas.push({ perguntaId: pergunta.id, membroId: membro.id, pcoId: pco.id, texto: textosLivres[i % textosLivres.length] })
        }
      }
    }

    await prisma.respostaPCO.createMany({ data: respostas, skipDuplicates: true })
  }

  // Curadoria do relatório PCO
  await prisma.relatorioPCOMeta.upsert({
    where: { pcoId: pco.id },
    create: {
      pcoId: pco.id,
      capaTitulo: "Resultados da Pesquisa de Clima Organizacional",
      objetivo: "Mapear a percepção dos membros sobre cultura, desenvolvimento e comunicação interna para embasar iniciativas de melhoria no semestre.",
      conclusao: "Os resultados indicam um ambiente positivo, com destaques para a cultura de aprendizado. Os pontos de atenção estão relacionados à comunicação entre áreas e à frequência de feedbacks estruturados.",
    },
    update: {
      capaTitulo: "Resultados da Pesquisa de Clima Organizacional",
      objetivo: "Mapear a percepção dos membros sobre cultura, desenvolvimento e comunicação interna para embasar iniciativas de melhoria no semestre.",
      conclusao: "Os resultados indicam um ambiente positivo, com destaques para a cultura de aprendizado. Os pontos de atenção estão relacionados à comunicação entre áreas e à frequência de feedbacks estruturados.",
    },
  })

  for (const secao of pco.secoes) {
    await prisma.relatorioSecaoPCO.upsert({
      where: { secaoId: secao.id },
      create: {
        secaoId: secao.id,
        introducao: `Esta seção avalia ${secao.titulo.toLowerCase()} sob a perspectiva dos membros do clube.`,
        conclusao: `De forma geral, os membros avaliam positivamente os aspectos de ${secao.titulo.toLowerCase()}.`,
      },
      update: {
        introducao: `Esta seção avalia ${secao.titulo.toLowerCase()} sob a perspectiva dos membros do clube.`,
        conclusao: `De forma geral, os membros avaliam positivamente os aspectos de ${secao.titulo.toLowerCase()}.`,
      },
    })

    for (const pergunta of secao.perguntas) {
      if (pergunta.tipo === "ESCALA") {
        await prisma.relatorioPerguntaPCO.upsert({
          where: { perguntaId: pergunta.id },
          create: {
            perguntaId: pergunta.id,
            insightTexto: `${Math.round(70 + Math.random() * 25)}% dos membros concordam ou concordam parcialmente com esta afirmação.`,
            agrupamentos: [
              { count: 7, texto: "Valoriza a transparência e comunicação aberta" },
              { count: 4, texto: "Destaca a necessidade de mais estrutura" },
            ],
            callouts: secao.ordem === 3
              ? [{ tipo: "ATENCAO", texto: "Desvio elevado entre áreas — coordenadores percebem melhor do que membros gerais." }]
              : undefined,
          },
          update: {
            insightTexto: `${Math.round(70 + Math.random() * 25)}% dos membros concordam ou concordam parcialmente com esta afirmação.`,
          },
        })
      }
    }
  }

  console.log(`✅ PCO criada — ID: ${pco.id}`)

  // ============================================================
  // 6. AV360
  // ============================================================
  console.log("\n🔄 Criando AV360...")

  const av360 = await prisma.avaliacao360.create({
    data: {
      nome: AV360_NOME,
      descricao: "Avaliação 360 graus para testar o relatório PDF.",
      status: StatusAvaliacao360.ENCERRADA,
      dataInicio: new Date("2025-03-01"),
      dataFim: new Date("2025-03-15"),
      idCiclo: ciclo.id,
      dimensoes: {
        create: [
          {
            titulo: "Execução e Entrega",
            descricao: "Capacidade de entregar resultados com qualidade e dentro dos prazos.",
            ordem: 0,
            perguntas: {
              create: [
                { texto: "Cumpre prazos e entregas com consistência.", tipo: TipoPergunta360.ESCALA, obrigatoria: true, ordem: 0 },
                { texto: "Produz trabalhos com alta qualidade técnica.", tipo: TipoPergunta360.ESCALA, obrigatoria: true, ordem: 1 },
                { texto: "É proativo(a) em antecipar e resolver problemas.", tipo: TipoPergunta360.ESCALA, obrigatoria: true, ordem: 2 },
              ],
            },
          },
          {
            titulo: "Comunicação e Colaboração",
            descricao: "Clareza na comunicação e capacidade de trabalhar em equipe.",
            ordem: 1,
            perguntas: {
              create: [
                { texto: "Comunica-se de forma clara e objetiva.", tipo: TipoPergunta360.ESCALA, obrigatoria: true, ordem: 0 },
                { texto: "Colabora ativamente com a equipe e outros membros.", tipo: TipoPergunta360.ESCALA, obrigatoria: true, ordem: 1 },
                { texto: "Dá e recebe feedbacks de forma construtiva.", tipo: TipoPergunta360.ESCALA, obrigatoria: true, ordem: 2 },
              ],
            },
          },
          {
            titulo: "Liderança e Iniciativa",
            descricao: "Capacidade de liderar, influenciar positivamente e tomar iniciativa.",
            ordem: 2,
            perguntas: {
              create: [
                { texto: "Toma iniciativa e vai além das responsabilidades formais.", tipo: TipoPergunta360.ESCALA, obrigatoria: true, ordem: 0 },
                { texto: "Contribui para o desenvolvimento de outros membros.", tipo: TipoPergunta360.ESCALA, obrigatoria: true, ordem: 1 },
              ],
            },
          },
          {
            titulo: "Cultura e Valores",
            descricao: "Alinhamento com os valores e a cultura do clube.",
            ordem: 3,
            perguntas: {
              create: [
                { texto: "Demonstra comprometimento com os valores e a missão do clube.", tipo: TipoPergunta360.ESCALA, obrigatoria: true, ordem: 0 },
                { texto: "Contribui para um ambiente saudável e inclusivo.", tipo: TipoPergunta360.ESCALA, obrigatoria: true, ordem: 1 },
                { texto: "Compartilhe um ponto forte e um ponto de desenvolvimento deste membro:", tipo: TipoPergunta360.TEXTO_ABERTO, obrigatoria: false, ordem: 2 },
              ],
            },
          },
        ],
      },
    },
    include: {
      dimensoes: {
        include: { perguntas: true },
        orderBy: { ordem: "asc" },
      },
    },
  })

  // Pares: cada membro avalia todos da mesma área + coordenadores de outras áreas
  const pares: Array<{ avaliadorId: number; avaliadoId: number }> = []
  for (const avaliador of todosMembros) {
    for (const avaliado of todosMembros) {
      if (avaliador.id === avaliado.id) continue
      const mesmaArea = avaliador.areaId === avaliado.areaId
      const avaliadoEhCoord = avaliado.isCoordenador
      if (mesmaArea || avaliadoEhCoord) {
        pares.push({ avaliadorId: avaliador.id, avaliadoId: avaliado.id })
      }
    }
  }

  await prisma.feedback360.createMany({
    data: pares.map(p => ({
      avaliacaoId: av360.id,
      avaliadorId: p.avaliadorId,
      avaliadoId: p.avaliadoId,
      finalizado: true,
    })),
    skipDuplicates: true,
  })

  const feedbacksCriados = await prisma.feedback360.findMany({ where: { avaliacaoId: av360.id } })

  const perguntasEscala = av360.dimensoes.flatMap(d => d.perguntas).filter(p => p.tipo === "ESCALA")
  const perguntasTexto  = av360.dimensoes.flatMap(d => d.perguntas).filter(p => p.tipo === "TEXTO_ABERTO")

  const comentariosPositivos = [
    "Ponto forte: excelente capacidade de entrega e dedicação. Desenvolvimento: poderia se comunicar mais proativamente com a equipe.",
    "Ponto forte: muita iniciativa e criatividade nas soluções. Desenvolvimento: atenção aos prazos em projetos paralelos.",
    "Ponto forte: ótima colaboração e espírito de equipe. Desenvolvimento: desenvolver mais assertividade nas opiniões.",
    "Ponto forte: comprometimento exemplar com os valores do clube. Desenvolvimento: aprofundar conhecimento técnico da área.",
    "Ponto forte: liderança natural e inspiradora. Desenvolvimento: delegar mais e confiar na equipe.",
    "Ponto forte: comunicação clara e objetiva. Desenvolvimento: ser mais proativo em momentos de incerteza.",
  ]

  for (let fi = 0; fi < feedbacksCriados.length; fi++) {
    const feedback = feedbacksCriados[fi]
    const respostas = []

    for (let pi = 0; pi < perguntasEscala.length; pi++) {
      const baseNota = 7 + ((fi + pi) % 4)
      respostas.push({
        feedbackId: feedback.id,
        perguntaId: perguntasEscala[pi].id,
        nota: Math.min(10, Math.max(6, baseNota)),
      })
    }

    if (fi % 3 === 0) {
      for (const pergunta of perguntasTexto) {
        respostas.push({
          feedbackId: feedback.id,
          perguntaId: pergunta.id,
          texto: comentariosPositivos[fi % comentariosPositivos.length],
        })
      }
    }

    await prisma.respostaPergunta360.createMany({ data: respostas, skipDuplicates: true })
  }

  // Curadoria meta AV360
  await prisma.relatorioAV360Meta.upsert({
    where: { avaliacaoId: av360.id },
    create: {
      avaliacaoId: av360.id,
      capaTitulo: "Resultados da Avaliação 360° — 1º Semestre 2025",
      objetivo: "Mapear o desenvolvimento individual dos membros sob a perspectiva de pares, líderes e liderados, identificando pontos fortes e oportunidades de crescimento.",
      conclusao: "Os resultados revelam um time com alta capacidade de entrega e boa colaboração. As dimensões de Liderança e Iniciativa apresentam maior variabilidade, indicando oportunidade de desenvolvimento diferenciado por perfil.",
    },
    update: {
      capaTitulo: "Resultados da Avaliação 360° — 1º Semestre 2025",
      objetivo: "Mapear o desenvolvimento individual dos membros sob a perspectiva de pares, líderes e liderados.",
      conclusao: "Os resultados revelam um time com alta capacidade de entrega e boa colaboração.",
    },
  })

  for (const dim of av360.dimensoes) {
    await prisma.relatorioDimensao360.upsert({
      where: { dimensaoId: dim.id },
      create: {
        dimensaoId: dim.id,
        insightTexto: `A dimensão de ${dim.titulo} apresentou média acima de 8.0, com maior destaque entre coordenadores.`,
        callouts: dim.ordem === 2
          ? [{ tipo: "ATENCAO", texto: "Alta variância nesta dimensão — distribuição heterogênea entre áreas." }]
          : undefined,
      },
      update: {
        insightTexto: `A dimensão de ${dim.titulo} apresentou média acima de 8.0, com maior destaque entre coordenadores.`,
      },
    })
  }

  console.log(`✅ AV360 criada — ID: ${av360.id}`)
  console.log(`   ${feedbacksCriados.length} feedbacks gerados com respostas`)

  // ============================================================
  // RESUMO FINAL
  // ============================================================
  console.log("\n" + "=".repeat(60))
  console.log("🎉 SEED CONCLUÍDO!")
  console.log("=".repeat(60))
  console.log(`\n📋 PCO`)
  console.log(`   ID: ${pco.id}`)
  console.log(`   URL: /coord/pco/${pco.id}`)
  console.log(`   Membros participantes: ${todosMembros.length}`)
  console.log(`\n🔄 AV360`)
  console.log(`   ID: ${av360.id}`)
  console.log(`   URL: /coord/avaliacoes-360/${av360.id}`)
  console.log(`   Pares avaliados: ${feedbacksCriados.length}`)
}

main()
  .catch(e => {
    console.error("❌ Erro no seed:", e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
