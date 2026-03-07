"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { CustomAlert, AlertType } from "@/src/app/components/CustomAlert";
import { ChevronRight, Plus, Trash2 } from "lucide-react";
import {
    getQuestaoSimuladoById,
    createQuestaoSimulado,
    updateQuestaoSimulado,
} from "@/src/actions/simuladosActions";
import { BancoSimulado, DificuldadeSimulado } from "@/src/generated/prisma/client";

interface AlternativaForm {
    id?: number;
    texto: string;
    correta: boolean;
    tempId: string;
}

export default function CriarQuestaoPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const questaoId = searchParams.get("id");

    const [enunciado, setEnunciado] = useState("");
    const [banco, setBanco] = useState<BancoSimulado | "">("");
    const [dificuldade, setDificuldade] = useState<DificuldadeSimulado | "">("");
    const [imageName, setImageName] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [alternativas, setAlternativas] = useState<AlternativaForm[]>([
        { texto: "", correta: true, tempId: "1" },
        { texto: "", correta: false, tempId: "2" },
        { texto: "", correta: false, tempId: "3" },
        { texto: "", correta: false, tempId: "4" },
        { texto: "", correta: false, tempId: "5" },
    ]);

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
                        setImageName(question.imagemUrl || null);
                        if (question.alternativas && question.alternativas.length > 0) {
                            setAlternativas(question.alternativas.map(a => ({
                                id: a.id,
                                texto: a.texto,
                                correta: a.correta,
                                tempId: Math.random().toString(36).substring(7)
                            })));
                        }
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

    const handleAddAlternativa = () => {
        setAlternativas([...alternativas, { texto: "", correta: false, tempId: Math.random().toString(36).substring(7) }]);
    };

    const handleRemoveAlternativa = (index: number) => {
        if (alternativas.length <= 2) {
            setAlertConfig({
                isOpen: true,
                type: "warning",
                title: "Atenção",
                message: "Uma questão de múltipla escolha deve ter pelo menos 2 alternativas.",
                onConfirm: closeAlert
            });
            return;
        }

        const newAlternativas = [...alternativas];
        const removedWasCorrect = newAlternativas[index].correta;
        newAlternativas.splice(index, 1);

        if (removedWasCorrect && newAlternativas.length > 0) {
            newAlternativas[0].correta = true;
        }

        setAlternativas(newAlternativas);
    };

    const handleAlternativaChange = (index: number, field: 'texto' | 'correta', value: any) => {
        const newAlternativas = [...alternativas];

        if (field === 'correta') {
            // Se marcou esta como correta, desmarca as outras
            newAlternativas.forEach((alt, i) => {
                alt.correta = i === index;
            });
        } else {
            newAlternativas[index][field] = value;
        }

        setAlternativas(newAlternativas);
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

        if (alternativas.length < 2) {
            return showError("Uma questão de múltipla escolha deve ter pelo menos 2 alternativas.");
        }

        const emptyAlternativa = alternativas.find(a => !a.texto.trim());
        if (emptyAlternativa) {
            return showError("Todas as alternativas devem ter um texto preenchido.");
        }

        const hasCorreta = alternativas.some(a => a.correta);
        if (!hasCorreta) {
            return showError("Selecione qual é a alternativa correta marcando a opção correspondente.");
        }

        setLoading(true);
        try {
            const dataToSave = {
                enunciado,
                banco: banco as BancoSimulado,
                dificuldade: dificuldade as DificuldadeSimulado,
                imagemUrl: imageName,
                alternativas: alternativas.map((a, index) => ({
                    texto: a.texto,
                    correta: a.correta,
                    ordem: index
                }))
            };

            if (questaoId) {
                await updateQuestaoSimulado(Number(questaoId), dataToSave);
            } else {
                await createQuestaoSimulado(dataToSave);
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
                            : "Cadastre uma nova questão objetiva no banco de GMAT ou Business Case."}
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

                        {/* Alternativas */}
                        <div className="space-y-4 pt-6 border-t border-gray-100">
                            <div className="flex items-center justify-between mb-4">
                                <label className="block text-sm font-bold text-gray-700 uppercase tracking-wide">
                                    Alternativas
                                </label>
                                <button
                                    type="button"
                                    onClick={handleAddAlternativa}
                                    className="flex items-center gap-2 text-primary font-bold hover:bg-primary/10 px-3 py-1.5 rounded-lg transition-colors text-sm cursor-pointer"
                                >
                                    <Plus size={16} />
                                    <span>Adicionar Alternativa</span>
                                </button>
                            </div>

                            <div className="space-y-3">
                                {alternativas.map((alt, index) => (
                                    <div key={alt.tempId} className={`flex items-start gap-4 p-4 rounded-xl border-2 transition-colors ${alt.correta ? 'border-primary bg-primary/5' : 'border-gray-200 bg-gray-50/50'}`}>
                                        <div className="flex flex-col items-center gap-2 pt-2">
                                            <span className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center font-bold text-gray-600 shadow-sm shrink-0">
                                                {String.fromCharCode(65 + index)}
                                            </span>
                                        </div>

                                        <div className="flex-1 flex flex-col gap-3">
                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="radio"
                                                    id={`correct-r-${alt.tempId}`}
                                                    name="correct-answer"
                                                    checked={alt.correta}
                                                    onChange={() => handleAlternativaChange(index, 'correta', true)}
                                                    className="w-4 h-4 text-primary focus:ring-primary border-gray-300"
                                                />
                                                <label htmlFor={`correct-r-${alt.tempId}`} className={`text-sm font-bold cursor-pointer ${alt.correta ? 'text-primary' : 'text-gray-500'}`}>
                                                    {alt.correta ? 'Esta é a alternativa correta' : 'Marcar como correta'}
                                                </label>
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveAlternativa(index)}
                                                    className="ml-auto text-gray-400 hover:text-red-500 transition-colors cursor-pointer p-1"
                                                    title="Remover alternativa"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>

                                            <textarea
                                                value={alt.texto}
                                                onChange={(e) => handleAlternativaChange(index, 'texto', e.target.value)}
                                                placeholder="Digite o texto da alternativa..."
                                                className={`w-full p-3 rounded-lg border focus:ring-2 focus:ring-[#FAD419]/50 outline-none transition-all text-sm min-h-[80px] text-text-main
                                                ${alt.correta ? 'border-[#FAD419] bg-white ' : 'border-gray-200 bg-white focus:border-gray-400'}`}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
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
