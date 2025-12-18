"use server"
import prisma from '../lib/prisma';

export async function getActiveMembers() {
  const members = await prisma.membro.findMany({
    where: {
      isAtivo: true,
    },
    select: {
      id: true,
      nome: true,
      fotoUrl: true,
      area: {
        select: {
          nome: true,
        }
      }
    }
  });

  return members.map((member) => ({
    value: String(member.id),
    label: member.nome,
    foto: member.fotoUrl,
    area: member.area.nome,
  }));
}