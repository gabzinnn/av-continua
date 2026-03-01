"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/src/app/components/Button";
import { useCandidato } from "../../../candidatoContext";
import { iniciarProva } from "@/src/actions/candidatoActions";
import { ArrowLeft, Play } from "lucide-react";

interface Prova {
    id: number;
    titulo: string;
    descricao: string | null;
    tempoLimite: number | null;
}

interface InstrucoesContentProps {
    prova: Prova;
}

const instrucoes = [
    {
        icon: "info",
        title: "Sobre a Prova",
        description: "A Prova é composta por questões objetivas e discursivas, e pode ser realizada sem qualquer conhecimento prévio sobre temas de consultoria e negócios.",
    },
    {
        icon: "edit_note",
        title: "Material Recomendado",
        description: "Recomendamos que tenha em mãos papel e caneta para eventuais anotações e cálculos.",
    },
    {
        icon: "person",
        title: "Execução Individual",
        description: "A realização deve ocorrer de forma individual, sem auxílio externo.",
    },
    {
        icon: "quiz",
        title: "Interpretação",
        description: "As interpretações dos enunciados fazem parte da avaliação, portanto, não serão prestados esclarecimentos adicionais.",
    },
    {
        icon: "wifi",
        title: "Conexão de Internet",
        description: "Verifique se sua conexão está estável. Interrupções podem afetar o envio das respostas.",
    },
    {
        icon: "schedule",
        title: "Duração",
        description: "", // Será preenchido dinamicamente
    },
    {
        icon: "forward",
        title: "Navegação Única",
        description: "Atenção: Não é possível voltar para questões anteriores. Avance apenas quando tiver certeza.",
    },
    {
        icon: "exit_to_app",
        title: "Saída da Tela",
        description: "Se você sair da tela da prova duas vezes, a prova será encerrada automaticamente e a perda será irreversível. Mantenha-se na tela durante toda a realização.",
    },
];

export default function InstrucoesContent({ prova }: InstrucoesContentProps) {
    const router = useRouter();
    const { candidato, isRegistered, resultadoId } = useCandidato();
    const [isStarting, setIsStarting] = useState(false);

    // Redireciona se não estiver registrado
    if (!isRegistered) {
        router.push("/prova");
        return null;
    }

    const handleVoltar = () => {
        router.push("/prova");
    };

    const handleComecar = async () => {
        setIsStarting(true);
        if (resultadoId) {
            await iniciarProva(resultadoId);
        }
        router.push(`/prova/${prova.id}/questoes`);
    };

    const formatarTempo = (minutos: number | null) => {
        if (!minutos) return "Tempo não definido";
        if (minutos >= 60) {
            const horas = Math.floor(minutos / 60);
            const mins = minutos % 60;
            return mins > 0 ? `${horas}h ${mins}min` : `${horas}h`;
        }
        return `${minutos} minutos`;
    };

    return (
        <div className="w-full max-w-3xl">
            {/* Central Card */}
            <div className="bg-bg-card rounded-2xl shadow-xl overflow-hidden border border-border-ui">
                {/* Card Header */}
                <div className="px-8 pt-8 pb-4">
                    <div className="flex items-center gap-3 mb-2">
                        <span className="material-symbols-outlined text-primary text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                            assignment
                        </span>
                        <h1 className="text-3xl font-bold text-text-main tracking-tight">
                            Instruções da Prova
                        </h1>
                    </div>
                    <p className="text-text-muted text-base mt-2">
                        Leia atentamente todas as regras antes de iniciar sua avaliação.
                    </p>
                </div>

                {/* Divider */}
                <div className="h-px w-full bg-border-ui"></div>

                <div className="p-8 space-y-8">
                    {/* Instructions Checklist */}
                    <div className="space-y-4">
                        {instrucoes.map((item, index) => (
                            <div
                                key={index}
                                className="flex items-start gap-4 p-3 rounded-lg hover:bg-stone-50 transition-colors group"
                            >
                                <div className="mt-0.5 min-w-[24px]">
                                    <span
                                        className="material-symbols-outlined text-primary text-2xl group-hover:scale-110 transition-transform"
                                        style={{ fontVariationSettings: "'FILL' 1" }}
                                    >
                                        {item.icon}
                                    </span>
                                </div>
                                <div>
                                    <h3 className="font-semibold text-text-main text-lg">
                                        {item.title}
                                    </h3>
                                    <p className="text-text-muted">
                                        {item.title === "Duração"
                                            ? `O tempo total de duração é de ${formatarTempo(prova.tempoLimite)}. Um cronômetro será exibido na tela.`
                                            : item.description}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Warning Call-out Box */}
                    <div className="relative overflow-hidden rounded-xl border-2 border-primary bg-primary/5 p-6 flex flex-col sm:flex-row gap-5 items-center sm:items-start text-center sm:text-left">
                        <div className="shrink-0 bg-primary/20 p-3 rounded-full flex items-center justify-center">
                            <span
                                className="material-symbols-outlined text-text-main text-3xl"
                                style={{ fontVariationSettings: "'FILL' 1" }}
                            >
                                warning
                            </span>
                        </div>
                        <div className="flex-1">
                            <h4 className="text-lg font-bold text-text-main mb-1">
                                Atenção Importante
                            </h4>
                            <p className="text-text-main font-medium leading-relaxed">
                                Ao clicar em{" "}
                                <span className="font-bold underline decoration-primary decoration-2 underline-offset-2">
                                    começar
                                </span>
                                , a prova será iniciada imediatamente e o cronômetro não poderá
                                ser pausado.
                            </p>
                            <p className="text-text-main font-medium leading-relaxed mt-2">
                                <span className="font-bold text-red-600">⚠ Sair da tela duas vezes</span>{" "}
                                resultará na perda irreversível da prova. Certifique-se de permanecer na página durante toda a realização.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="bg-stone-50 px-8 py-6 flex flex-col-reverse sm:flex-row justify-between items-center gap-4 border-t border-border-ui">
                    <Button
                        variant="outline"
                        onClick={handleVoltar}
                        icon={<ArrowLeft size={20} />}
                        iconPosition="left"
                    >
                        Voltar
                    </Button>
                    <Button
                        onClick={handleComecar}
                        isLoading={isStarting}
                        icon={<Play size={20} />}
                    >
                        Começar Prova
                    </Button>
                </div>
            </div>

            {/* Helper text */}
            <p className="text-center text-sm text-text-muted mt-6">
                Caso tenha problemas técnicos, entre em contato com o suporte
                imediatamente.
            </p>
        </div>
    );
}
