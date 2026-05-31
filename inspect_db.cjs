const { PrismaClient } = require('./src/generated/prisma');
const prisma = new PrismaClient();

async function main() {
    const perguntas = await prisma.pergunta360.findMany({
        where: { tipo: 'TEXTO_ABERTO' }
    });
    console.log('TEXTO_ABERTO questions in DB:');
    console.log(JSON.stringify(perguntas, null, 2));

    const respostas = await prisma.resposta360.findMany({
        where: {
            perguntaId: { in: perguntas.map(p => p.id) },
            texto: { not: null }
        },
        take: 10
    });
    console.log('\nSample answers:');
    console.log(JSON.stringify(respostas.map(r => ({ id: r.id, perguntaId: r.perguntaId, texto: r.texto })), null, 2));
}

main().finally(() => prisma.$disconnect());
