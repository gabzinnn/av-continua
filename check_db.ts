import { PrismaClient } from './src/generated/prisma/client';

const prisma = new PrismaClient();

async function main() {
    const questoes = await prisma.questaoSimulado.findMany({
        include: { alternativas: true }
    });
    console.log('Total questoes:', questoes.length);
    const withoutAlt = questoes.filter(q => q.alternativas.length === 0);
    console.log('Questoes sem alternativas:', withoutAlt.length);
    const withAlt = questoes.filter(q => q.alternativas.length > 0);
    console.log('Questoes com alternativas:', withAlt.length);

    if (withAlt.length > 0) {
        console.log('Sample with alt:', {
            banco: withAlt[0].banco,
            dificuldade: withAlt[0].dificuldade,
            alts: withAlt[0].alternativas.length
        });
    }
}

main().catch(console.error).finally(() => prisma.$disconnect());
