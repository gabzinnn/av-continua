"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { CustomAlert, AlertType } from "@/src/app/components/CustomAlert";
import { ChevronRight } from "lucide-react";
import {
    getQuestaoSimuladoById,
    createQuestaoSimulado,
    updateQuestaoSimulado,
} from "@/src/actions/simuladosActions";
import { BancoSimulado, DificuldadeSimulado } from "@/src/generated/prisma/client";

export default function CriarQuestaoPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const questaoId = searchParams.get("id");

    const [enunciado, setEnunciado] = useState("");
    const [banco, setBanco] = useState<BancoSimulado | "">("");
    const [dificuldade, setDificuldade] = useState<DificuldadeSimulado | "">("");
    const [respostaModelo, setRespostaModelo] = useState("");
    const [imageName, setImageName] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Custom Alert State
    const [alertConfig, setAlertConfig] = useState<{
        isOpen: boolean;
        type: AlertType;
        title: string;
        message: string;
        onConfirm: () => void;
    }>({
        isOpen: false,
        type: "error",
        title: "",
        message: "",
        onConfirm: () => { }
    });

    const closeAlert = () => setAlertConfig(prev => ({ ...prev, isOpen: false }));

    useEffect(() => {
        if (questaoId) {
            (async () => {
                try {
                    const question = await getQuestaoSimuladoById(Number(questaoId));
                    if (question) {
                        setEnunciado(question.enunciado);
                        setBanco(question.banco);
                        setDificuldade(question.dificuldade || "");
                        setRespostaModelo(question.respostaModelo || "");
                        setImageName(question.imagemUrl || null);
                    }
                } catch (err) {
                    console.error("Erro ao carregar questão:", err);
                }
            })();
        }
    }, [questaoId]);

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            setImageName(e.target.files[0].name);
        }
    };

    const handleSave = async () => {
        const showError = (message: string) => {
            setAlertConfig({
                isOpen: true,
                type: "error",
                title: "Campos Incompletos",
                message,
                onConfirm: closeAlert
            });
        };

        // Validação
        if (!enunciado.trim()) return showError("Por favor, preencha o enunciado da questão.");
        if (!banco) return showError("Selecione qual banco a questão pertencerá.");
        if (!dificuldade) return showError("Selecione o nível de dificuldade.");
        if (!respostaModelo.trim()) return showError("Preencha a resposta modelo esperada para a questão discursiva.");

        setLoading(true);
        try {
            if (questaoId) {
                await updateQuestaoSimulado(Number(questaoId), {
                    enunciado,
                    banco: banco as BancoSimulado,
                    dificuldade: dificuldade as DificuldadeSimulado,
                    respostaModelo,
                    imagemUrl: imageName,
                });
            } else {
                await createQuestaoSimulado({
                    enunciado,
                    banco: banco as BancoSimulado,
                    dificuldade: dificuldade as DificuldadeSimulado,
                    respostaModelo,
                    imagemUrl: imageName,
                });
            }

            setAlertConfig({
                isOpen: true,
                type: "success",
                title: "Sucesso!",
                message: questaoId ? "A questão foi atualizada com sucesso no banco de dados." : "A nova questão foi salva com sucesso no banco de dados.",
                onConfirm: () => {
                    closeAlert();
                    router.push('/coord/programa-preparacao/simulados');
                }
            });
        } catch (err) {
            console.error("Erro ao salvar:", err);
            setAlertConfig({
                isOpen: true,
                type: "error",
                title: "Erro",
                message: "Ocorreu um erro ao salvar a questão. Tente novamente.",
                onConfirm: closeAlert
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex-1 overflow-y-auto bg-bg-main min-h-screen">
            <CustomAlert {...alertConfig} />
            <header className="px-8 pt-8">
                <nav className="flex items-center gap-2 text-sm font-medium text-gray-400 mb-6 uppercase tracking-widest">
                    <button
                        onClick={() => router.push("/coord/home")}
                        className="text-text-muted hover:text-primary transition-colors cursor-pointer"
                    >
                        Dashboard
                    </button>
                    <ChevronRight size={14} className="text-text-muted" />
                    <span>Programa de Preparação</span>
                    <ChevronRight size={14} className="text-text-muted" />
                    <button
                        onClick={() => router.push("/coord/programa-preparacao/simulados")}
                        className="text-text-muted hover:text-primary transition-colors cursor-pointer"
                    >
                        Simulados
                    </button>
                    <ChevronRight size={14} className="text-text-muted" />
                    <span className="text-text-main font-bold">{questaoId ? "Editar Questão" : "Criar Questão"}</span>
                </nav>
                <div className="mb-8">
                    <h2 className="text-3xl font-black text-text-main tracking-tight">{questaoId ? "Editar Questão" : "Nova Questão"}</h2>
                    <p className="text-gray-500 mt-1 max-w-2xl text-sm">
                        {questaoId
                            ? "Altere os dados da questão selecionada e salve as modificações."
                            : "Cadastre uma nova questão discursiva no banco de GMAT ou Business Case."}
                    </p>
                </div>
            </header>

            <div className="px-8 pb-12">
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden max-w-[1200px] mx-auto">
                    <div className="p-8 space-y-8">
                        {/* Enunciado */}
                        <div className="space-y-3">
                            <label className="block text-sm font-bold text-gray-700 uppercase tracking-wide">
                                Enunciado da Questão
                            </label>
                            <textarea
                                value={enunciado}
                                onChange={(e) => setEnunciado(e.target.value)}
                                className="w-full min-h-[160px] p-4 rounded-lg border border-gray-200 bg-gray-50 text-text-main focus:ring-2 focus:ring-[#FAD419]/50 focus:border-[#FAD419] outline-none transition-all placeholder:text-gray-400"
                                placeholder="Digite o enunciado completo da questão aqui..."
                            />
                        </div>

                        {/* Upload de Imagem */}
                        <div className="space-y-3">
                            <label className="block text-sm font-bold text-gray-700 uppercase tracking-wide">
                                Imagem Auxiliar (Opcional)
                            </label>
                            <input
                                type="file"
                                className="hidden"
                                ref={fileInputRef}
                                onChange={handleImageUpload}
                                accept="image/png, image/jpeg"
                            />
                            <div
                                onClick={() => fileInputRef.current?.click()}
                                className={`border-2 border-dashed ${imageName ? "border-[#FAD419] bg-[#FCE98C]/20" : "border-gray-200 bg-gray-50/50"} rounded-lg p-8 flex flex-col items-center justify-center hover:bg-gray-50 transition-colors cursor-pointer group`}
                            >
                                {imageName ? (
                                    <>
                                        <span className="material-symbols-outlined text-[#FAD419] text-4xl mb-2">check_circle</span>
                                        <p className="text-sm text-gray-700 font-bold text-center">Imagem anexada: {imageName}</p>
                                        <p className="text-xs text-gray-500 mt-1 hover:text-gray-700 transition-colors">Clique para alterar</p>
                                    </>
                                ) : (
                                    <>
                                        <span className="material-symbols-outlined text-gray-400 group-hover:text-[#FAD419] text-4xl mb-2 transition-colors">add_photo_alternate</span>
                                        <p className="text-sm text-gray-500 font-medium text-center">Clique para fazer upload ou arraste uma imagem (PNG, JPG)</p>
                                        <p className="text-xs text-gray-400 mt-1">Tamanho máximo: 2MB</p>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Banco e Dificuldade */}
                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                            <div className="space-y-3">
                                <label className="block text-sm font-bold text-gray-700 uppercase tracking-wide">Banco</label>
                                <select
                                    value={banco}
                                    onChange={(e) => setBanco(e.target.value as BancoSimulado)}
                                    className="w-full p-3 rounded-lg border border-gray-200 bg-gray-50 text-text-main focus:ring-[#FAD419] focus:border-[#FAD419] outline-none"
                                >
                                    <option value="">Selecione o banco</option>
                                    <option value="GMAT">GMAT</option>
                                    <option value="BUSINESS_CASE">Business Case</option>
                                </select>
                            </div>
                            <div className="space-y-3">
                                <label className="block text-sm font-bold text-gray-700 uppercase tracking-wide">Dificuldade</label>
                                <select
                                    value={dificuldade}
                                    onChange={(e) => setDificuldade(e.target.value as DificuldadeSimulado)}
                                    className="w-full p-3 rounded-lg border border-gray-200 bg-gray-50 text-text-main focus:ring-[#FAD419] focus:border-[#FAD419] outline-none"
                                >
                                    <option value="">Selecione a dificuldade</option>
                                    <option value="FACIL">Fácil</option>
                                    <option value="MEDIO">Médio</option>
                                    <option value="DIFICIL">Difícil</option>
                                </select>
                            </div>
                        </div>

                        {/* Resposta Modelo */}
                        <div className="space-y-3 pt-6 border-t border-gray-100">
                            <label className="block text-sm font-bold text-gray-700 uppercase tracking-wide">
                                Resposta Modelo (Critério de Avaliação)
                            </label>
                            <textarea
                                value={respostaModelo}
                                onChange={(e) => setRespostaModelo(e.target.value)}
                                className="w-full min-h-[120px] p-4 rounded-lg border border-gray-200 bg-gray-50 text-text-main focus:ring-2 focus:ring-[#FAD419]/50 focus:border-[#FAD419] outline-none transition-all placeholder:text-gray-400"
                                placeholder="Descreva aqui o que é esperado na resposta do participante, tópicos abordados, e a lógica principal da resolução..."
                            />
                        </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="px-8 py-6 bg-gray-50 border-t border-gray-200 flex flex-col-reverse sm:flex-row justify-end items-center gap-4">
                        <Link
                            href="/coord/programa-preparacao/simulados"
                            className="w-full sm:w-auto px-6 py-2.5 rounded-lg border border-gray-300 text-gray-600 font-bold text-sm hover:bg-white text-center transition-colors"
                        >
                            Cancelar
                        </Link>
                        <button
                            type="button"
                            onClick={handleSave}
                            disabled={loading}
                            className="w-full sm:w-auto px-8 py-2.5 rounded-lg bg-[#FAD419] text-text-main font-black text-sm shadow-sm hover:bg-[#FAD419]/90 active:scale-[0.98] transition-all text-center cursor-pointer disabled:opacity-50"
                        >
                            {loading ? "Salvando..." : "Salvar Questão"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
