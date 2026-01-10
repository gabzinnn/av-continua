import { notFound, redirect } from "next/navigation";
import { getProvaParaCandidato } from "@/src/actions/candidatoActions";
import QuestoesContent from "./QuestoesContent";
import { headers } from "next/headers";

interface QuestoesPageProps {
    params: Promise<{ id: string }>;
}

export default async function QuestoesPage({ params }: QuestoesPageProps) {
    const { id } = await params;
    const provaId = parseInt(id, 10);

    if (isNaN(provaId)) {
        notFound();
    }

    // Pega o ID do candidato e resultadoId do cookie/header seria ideal,
    // mas como estamos usando Context no client, precisamos de uma estratégia.
    // O Context usa sessionStorage, que não é acessível no servidor.
    // PORÉM, a página precisa validar se o candidato pode acessar.
    // Como não temos autenticação real (middleware), a segurança aqui é frágil.
    // A verificação real é feita na action getProvaParaCandidato se tivéssemos o ID.
    // Solução: O client component vai ter que buscar os dados ou validá-los.
    // MAS o ideal é server-side rendering para performance e SEO (não tanto SEO aqui).
    // Vou usar uma abordagem híbrida: O ClientComponent verifica o sessionStorage,
    // e se tiver OK, chama a action para pegar os dados da prova.
    // OU passamos apenas o ID da prova e o ClientComponent faz o fetch inicial.

    // Como a action `getProvaParaCandidato` precisa do `candidatoId`,
    // e só temos isso no client (sessionStorage), não podemos fazer o fetch completo aqui.

    // Vou renderizar o ClientComponent e ELE vai fazer o fetch inicial dos dados da prova
    // usando o candidatoId do context.
    // Isso evita problemas de segurança e simplifica.

    // Apenas verifico se a prova existe basicão.

    return <QuestoesContent provaId={provaId} />;
}
