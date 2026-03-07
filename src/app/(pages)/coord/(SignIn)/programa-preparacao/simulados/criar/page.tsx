"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { CustomAlert, AlertType } from "@/src/app/components/CustomAlert";
import { ChevronRight, Plus, Trash2, X, Upload, Loader2, Image as ImageIcon } from "lucide-react";
import RichTextEditor from "@/src/app/components/RichTextEditor";
import Image from "next/image";
import {
    getQuestaoSimuladoById,
    createQuestaoSimulado,
    updateQuestaoSimulado,
} from "@/src/actions/simuladosActions";
import { uploadQuestaoImageToCloudinary } from "@/src/actions/uploadActions";
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
    const [imageUrls, setImageUrls] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);

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
                        setImageUrls(question.imagens?.map((img: any) => img.url) || []);
                        if (question.alternativas && question.alternativas.length > 0) {
                            setAlternativas(question.alternativas.map((a: any) => ({
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
                imagens: imageUrls.map((url, i) => ({ url, ordem: i })),
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
                            <RichTextEditor
                                value={enunciado}
                                onChange={(html) => setEnunciado(html)}
                                placeholder="Digite o enunciado completo da questão aqui..."
                                minHeight={160}
                            />
                        </div>

                        {/* Upload de Imagem */}
                        <div className="space-y-3">
                            <ImageUploader 
                                imageUrls={imageUrls}
                                onImagesChange={setImageUrls}
                            />
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

                                            <div className={`w-full p-1 rounded-lg border focus-within:ring-2 focus-within:ring-[#FAD419]/50 transition-all text-sm min-h-[80px] bg-white ${alt.correta ? 'border-[#FAD419]' : 'border-gray-200 focus-within:border-gray-400'}`}>
                                                <RichTextEditor
                                                    value={alt.texto}
                                                    onChange={(html) => handleAlternativaChange(index, 'texto', html)}
                                                    placeholder="Digite o texto da alternativa..."
                                                    minHeight={80}
                                                />
                                            </div>
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

// ==========================================
// ImageUploader Component
// ==========================================

interface ImageUploaderProps {
    imageUrls: string[]
    onImagesChange: (urls: string[]) => void
}

function ImageUploader({ imageUrls, onImagesChange }: ImageUploaderProps) {
    const [isUploading, setIsUploading] = useState(false)
    const [dragActive, setDragActive] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true)
        } else if (e.type === "dragleave") {
            setDragActive(false)
        }
    }

    const handleDrop = async (e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        setDragActive(false)

        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            await handleFiles(Array.from(e.dataTransfer.files))
        }
    }

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            await handleFiles(Array.from(e.target.files))
        }
    }

    const handleFiles = async (files: File[]) => {
        setIsUploading(true)
        const validFiles = files.filter(f => ["image/jpeg", "image/png", "image/webp", "image/gif"].includes(f.type))

        if (validFiles.length === 0) {
            alert("Nenhum arquivo de imagem válido selecionado.")
            setIsUploading(false)
            return
        }

        try {
            const newUrls: string[] = []

            for (const file of validFiles) {
                const formData = new FormData()
                formData.append("file", file)

                const result = await uploadQuestaoImageToCloudinary(formData)

                if (result.success && result.url) {
                    newUrls.push(result.url)
                } else {
                    console.error(`Erro ao fazer upload de ${file.name}:`, result.error)
                }
            }

            if (newUrls.length > 0) {
                onImagesChange([...imageUrls, ...newUrls])
            }
        } catch (error) {
            console.error("Upload error:", error)
            alert("Erro ao fazer upload das imagens")
        } finally {
            setIsUploading(false)
            if (fileInputRef.current) {
                fileInputRef.current.value = ""
            }
        }
    }

    const handleRemoveImage = (index: number) => {
        const newUrls = [...imageUrls]
        newUrls.splice(index, 1)
        onImagesChange(newUrls)
    }

    return (
        <div>
            <label className="block text-sm font-bold text-gray-700 uppercase tracking-wide mb-3">
                Imagens (opcional)
            </label>

            <div className="space-y-4">
                {imageUrls.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {imageUrls.map((url, index) => (
                            <div key={index} className="relative aspect-video rounded-lg border border-gray-200 overflow-hidden bg-gray-50 group">
                                <Image
                                    src={url}
                                    alt={`Imagem ${index + 1}`}
                                    fill
                                    className="object-cover"
                                    sizes="(max-width: 768px) 50vw, 25vw"
                                />
                                <button
                                    onClick={() => handleRemoveImage(index)}
                                    className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 shadow-sm cursor-pointer"
                                    title="Remover imagem"
                                >
                                    <X size={14} />
                                </button>
                                <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-[10px] p-1 text-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    Imagem {index + 1}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                <div
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`
                        border-2 border-dashed rounded-lg p-6 text-center cursor-pointer
                        transition-all duration-200 flex flex-col items-center justify-center gap-2
                        ${dragActive
                            ? "border-[#FAD419] bg-[#FCE98C]/20 scale-[1.01]"
                            : "border-gray-200 hover:border-[#FAD419] hover:bg-[#FCE98C]/10"
                        }
                        ${isUploading ? "pointer-events-none opacity-50" : ""}
                    `}
                >
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/gif"
                        multiple
                        onChange={handleFileChange}
                        className="hidden"
                    />

                    {isUploading ? (
                        <>
                            <Loader2 size={24} className="text-[#FAD419] animate-spin" />
                            <span className="text-sm text-gray-500">Enviando imagens...</span>
                        </>
                    ) : (
                        <>
                            <div className="p-2 bg-gray-100 rounded-full">
                                <Upload size={20} className="text-gray-400" />
                            </div>
                            <div>
                                <span className="text-sm font-medium text-gray-700">
                                    Adicionar imagens
                                </span>
                                <p className="text-xs text-gray-500 mt-0.5">
                                    Arraste ou clique (JPG, PNG, GIF)
                                </p>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    )
}
