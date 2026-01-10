"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { Button } from "@/src/app/components/Button";
import { Input } from "@/src/app/components/Input";
import { SearchableSelect } from "@/src/app/components/SearchableSelect";
import { cursosUFRJ } from "@/src/utils/cursosUFRJ";
import { cadastrarCandidato } from "@/src/actions/candidatoActions";
import { useCandidato } from "../candidatoContext";

interface Prova {
    id: number;
    titulo: string;
    descricao: string | null;
    tempoLimite: number | null;
}

interface IdentificacaoContentProps {
    prova: Prova;
}

export default function IdentificacaoContent({ prova }: IdentificacaoContentProps) {
    const router = useRouter();
    const { registrar } = useCandidato();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        nome: "",
        dre: "",
        periodo: "",
        curso: "",
        email: "",
    });

    const isFormValid =
        formData.nome.trim() !== "" &&
        formData.dre.trim() !== "" &&
        formData.periodo.trim() !== "" &&
        formData.curso !== "" &&
        formData.email.trim() !== "";

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
    ) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
        setError(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!isFormValid) return;

        setIsLoading(true);
        setError(null);

        try {
            const result = await cadastrarCandidato({
                nome: formData.nome,
                email: formData.email,
                curso: formData.curso,
                periodo: formData.periodo,
                dre: formData.dre,
                provaId: prova.id,
            });

            if (!result.success) {
                setError(result.error || "Erro ao cadastrar");
                setIsLoading(false);
                return;
            }

            // Salva no context
            registrar(result.candidato!, result.resultadoId!, prova.id);

            // Redireciona para a página de instruções
            router.push(`/prova/${prova.id}/instrucoes`);
        } catch (err) {
            console.error("Erro ao iniciar prova:", err);
            setError("Erro ao processar. Tente novamente.");
            setIsLoading(false);
        }
    };

    return (
        <div className="w-full max-w-[640px] bg-bg-card rounded-2xl shadow-lg border border-border-ui overflow-hidden relative z-10">
            {/* Logo Section */}
            <div className="flex justify-center pt-10 pb-2">
                <div className="w-20 h-20 bg-stone-50 rounded-2xl flex items-center justify-center border border-stone-100 shadow-sm">
                    <span className="material-symbols-outlined text-4xl text-primary">
                        school
                    </span>
                </div>
            </div>

            <div className="px-8 pb-10 pt-4 sm:px-12 sm:pb-12">
                {/* Headings */}
                <div className="text-center mb-8">
                    <h1 className="text-2xl sm:text-3xl font-bold text-text-main mb-2">
                        Bem-vindo(a) à Avaliação
                    </h1>
                    <p className="text-text-muted text-sm sm:text-base font-normal">
                        Preencha seus dados para iniciar a prova
                    </p>
                </div>

                {/* Form */}
                <form className="space-y-5" onSubmit={handleSubmit}>
                    {/* Nome */}
                    <Input
                        id="nome"
                        name="nome"
                        label="Nome completo"
                        placeholder="Digite seu nome completo"
                        icon="person"
                        value={formData.nome}
                        onChange={handleChange}
                    />

                    {/* DRE & Período */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        <Input
                            id="dre"
                            name="dre"
                            label="DRE"
                            placeholder="000000000"
                            icon="badge"
                            maxLength={9}
                            value={formData.dre}
                            onChange={handleChange}
                        />
                        <Input
                            id="periodo"
                            name="periodo"
                            label="Período"
                            placeholder="Ex: 2023.2"
                            icon="calendar_today"
                            value={formData.periodo}
                            onChange={handleChange}
                        />
                    </div>

                    {/* Curso (Select Buscável) */}
                    <SearchableSelect
                        id="curso"
                        name="curso"
                        label="Curso"
                        placeholder="Selecione seu curso"
                        options={cursosUFRJ}
                        value={formData.curso}
                        onChange={(value) => setFormData((prev) => ({ ...prev, curso: value }))}
                    />

                    {/* Email */}
                    <Input
                        id="email"
                        name="email"
                        type="email"
                        label="E-mail Institucional"
                        placeholder="seuemail@universidade.br"
                        icon="mail"
                        value={formData.email}
                        onChange={handleChange}
                    />

                    {/* Error Message */}
                    {error && (
                        <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
                            <span className="material-symbols-outlined text-red-500">error</span>
                            <p className="text-sm text-red-700">{error}</p>
                        </div>
                    )}

                    {/* Action Button */}
                    <div className="pt-6">
                        <Button
                            type="submit"
                            fullWidth
                            disabled={!isFormValid}
                            isLoading={isLoading}
                            icon={<ArrowRight size={20} />}
                        >
                            Continuar
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
