"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useSimulados, TipoQuestao, BancoQuestao, DificuldadeQuestao } from "../context";
import { CustomAlert, AlertType } from "@/src/app/components/CustomAlert";

export default function CriarQuestaoPage() {
    const { questoes, addQuestao, editQuestao } = useSimulados();
    const router = useRouter();
    const searchParams = useSearchParams();
    const questaoId = searchParams.get("id");

    const [tipoQuestao, setTipoQuestao] = useState<TipoQuestao>("Objetiva");
    const [enunciado, setEnunciado] = useState("");
    const [banco, setBanco] = useState<BancoQuestao | "">("");
    const [dificuldade, setDificuldade] = useState<DificuldadeQuestao | "">("");
    const [respostaModelo, setRespostaModelo] = useState("");
    const [alternativas, setAlternativas] = useState([
        { id: "A", texto: "", correta: true },
        { id: "B", texto: "", correta: false },
        { id: "C", texto: "", correta: false },
        { id: "D", texto: "", correta: false },
    ]);
    const [imageName, setImageName] = useState<string | null>(null);
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
            const questionToEdit = questoes.find(q => q.id === Number(questaoId));
            if (questionToEdit) {
                setTipoQuestao(questionToEdit.tipo);
                setEnunciado(questionToEdit.enunciado);
                setBanco(questionToEdit.banco);
                setDificuldade((questionToEdit.dificuldade as DificuldadeQuestao) || "");
                if (questionToEdit.tipo === "Objetiva" && questionToEdit.alternativas) {
                    setAlternativas(questionToEdit.alternativas);
                }
                if (questionToEdit.tipo === "Discursiva" && questionToEdit.respostaModelo) {
                    setRespostaModelo(questionToEdit.respostaModelo);
                }
                if (questionToEdit.imagem) {
                    setImageName(questionToEdit.imagem);
                }
            }
        }
    }, [questaoId, questoes]);

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            setImageName(e.target.files[0].name);
        }
    };

    const handleSave = () => {
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

        if (tipoQuestao === "Discursiva" && !respostaModelo.trim()) {
            return showError("Preencha a resposta modelo esperada para a questão discursiva.");
        }

        if (tipoQuestao === "Objetiva") {
            const hasEmptyAlt = alternativas.some(alt => !alt.texto.trim());
            if (hasEmptyAlt) return showError("Preencha o campo de texto de todas as alternativas.");
        }

        const newQuestionData = {
            enunciado,
            tipo: tipoQuestao,
            banco: banco as BancoQuestao,
            dificuldade: dificuldade as DificuldadeQuestao,
            respostaModelo: tipoQuestao === "Discursiva" ? respostaModelo : undefined,
            alternativas: tipoQuestao === "Objetiva" ? alternativas : undefined,
            imagem: imageName
        };

        if (questaoId) {
            editQuestao(Number(questaoId), newQuestionData);
        } else {
            addQuestao(newQuestionData);
        }

        setAlertConfig({
            isOpen: true,
            type: "success",
            title: "Sucesso!",
            message: questaoId ? "A questão foi atualizada com sucesso no banco de dados." : "A nova questão foi salva com sucesso no banco de dados.",
            onConfirm: () => {
                closeAlert();
                router.push('/programa-preparacao/simulados');
            }
        });
    };

    return (
        <div className="flex-1 overflow-y-auto bg-bg-main min-h-screen">
            <CustomAlert {...alertConfig} />
            <header className="px-8 pt-8">
                <div className="flex items-center gap-2 text-sm font-medium text-gray-400 mb-6 uppercase tracking-widest">
                    <Link href="/home" className="hover:text-[#FAD419] transition-colors">Dashboard</Link>
                    <span className="material-symbols-outlined text-sm">chevron_right</span>
                    <span>Programa de Preparação</span>
                    <span className="material-symbols-outlined text-sm">chevron_right</span>
                    <Link href="/programa-preparacao/simulados" className="hover:text-[#FAD419] transition-colors">Simulados</Link>
                    <span className="material-symbols-outlined text-sm">chevron_right</span>
                    <span className="text-text-main font-bold">{questaoId ? "Editar Questão" : "Criar Questão"}</span>
                </div>
                <div className="mb-8">
                    <h2 className="text-3xl font-black text-text-main tracking-tight">{questaoId ? "Editar Questão" : "Nova Questão"}</h2>
                    <p className="text-gray-500 mt-1 max-w-2xl text-sm">
                        {questaoId
                            ? "Altere os dados da questão selecionada e salve as modificações."
                            : "Cadastre uma nova questão no banco de GMAT ou Business Case."}
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

                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                            {/* Tipo */}
                            <div className="space-y-3">
                                <label className="block text-sm font-bold text-gray-700 uppercase tracking-wide">
                                    Tipo de Questão
                                </label>
                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setTipoQuestao("Objetiva")}
                                        className={`flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-semibold border-2 transition-colors ${tipoQuestao === "Objetiva"
                                            ? "border-[#FAD419] bg-[#FAD419]/5 text-text-main"
                                            : "border-gray-200 bg-transparent text-gray-400 hover:border-gray-300"
                                            }`}
                                    >
                                        <span className="material-symbols-outlined text-xl">list_alt</span>
                                        Objetiva
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setTipoQuestao("Discursiva")}
                                        className={`flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-semibold border-2 transition-colors ${tipoQuestao === "Discursiva"
                                            ? "border-[#FAD419] bg-[#FAD419]/5 text-text-main"
                                            : "border-gray-200 bg-transparent text-gray-400 hover:border-gray-300"
                                            }`}
                                    >
                                        <span className="material-symbols-outlined text-xl">edit_note</span>
                                        Discursiva
                                    </button>
                                </div>
                            </div>

                            {/* Banco e Dificuldade */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-3">
                                    <label className="block text-sm font-bold text-gray-700 uppercase tracking-wide">Banco</label>
                                    <select
                                        value={banco}
                                        onChange={(e) => setBanco(e.target.value as BancoQuestao)}
                                        className="w-full p-3 rounded-lg border border-gray-200 bg-gray-50 text-text-main focus:ring-[#FAD419] focus:border-[#FAD419] outline-none"
                                    >
                                        <option value="">Selecione o banco</option>
                                        <option value="GMAT">GMAT</option>
                                        <option value="Business Case">Business Case</option>
                                    </select>
                                </div>
                                <div className="space-y-3">
                                    <label className="block text-sm font-bold text-gray-700 uppercase tracking-wide">Dificuldade</label>
                                    <select
                                        value={dificuldade}
                                        onChange={(e) => setDificuldade(e.target.value as DificuldadeQuestao)}
                                        className="w-full p-3 rounded-lg border border-gray-200 bg-gray-50 text-text-main focus:ring-[#FAD419] focus:border-[#FAD419] outline-none"
                                    >
                                        <option value="">Selecione a dificuldade</option>
                                        <option value="Fácil">Fácil</option>
                                        <option value="Médio">Médio</option>
                                        <option value="Difícil">Difícil</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Campos Condicionais baseados no Tipo */}
                        <div className="space-y-6 pt-6 border-t border-gray-100">
                            {tipoQuestao === "Objetiva" ? (
                                <>
                                    <label className="block text-sm font-bold text-gray-700 uppercase tracking-wide">
                                        Alternativas e Resposta Correta
                                    </label>
                                    <div className="space-y-4">
                                        {alternativas.map((alt, index) => (
                                            <div key={alt.id} className={`flex items-start gap-4 p-4 rounded-lg bg-gray-50/50 border ${alt.correta ? "border-[#FAD419] bg-[#FCE98C]/10" : "border-gray-200 hover:border-gray-300"} transition-colors`}>
                                                <div className="pt-2">
                                                    <input
                                                        type="radio"
                                                        name="correct_alt"
                                                        checked={alt.correta}
                                                        onChange={() => {
                                                            setAlternativas(prev => prev.map((a, i) => ({ ...a, correta: i === index })));
                                                        }}
                                                        className="w-5 h-5 text-[#FAD419] focus:ring-[#FAD419] border-gray-300 bg-white"
                                                    />
                                                </div>
                                                <div className="flex-1">
                                                    <span className={`text-xs font-bold block mb-1 ${alt.correta ? "text-[#FAD419]" : "text-gray-400"}`}>
                                                        ALTERNATIVA {alt.id} {alt.correta && "(CORRETA)"}
                                                    </span>
                                                    <input
                                                        type="text"
                                                        value={alt.texto}
                                                        onChange={(e) => {
                                                            setAlternativas(prev => prev.map((a, i) => i === index ? { ...a, texto: e.target.value } : a));
                                                        }}
                                                        placeholder={`Digite a alternativa ${alt.id}...`}
                                                        className="w-full bg-transparent border-none p-0 focus:ring-0 text-text-main placeholder:text-gray-400 text-sm"
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </>
                            ) : (
                                <>
                                    <label className="block text-sm font-bold text-gray-700 uppercase tracking-wide">
                                        Resposta Modelo (Critério de Avaliação)
                                    </label>
                                    <div className="space-y-4">
                                        <textarea
                                            value={respostaModelo}
                                            onChange={(e) => setRespostaModelo(e.target.value)}
                                            className="w-full min-h-[120px] p-4 rounded-lg border border-gray-200 bg-gray-50 text-text-main focus:ring-2 focus:ring-[#FAD419]/50 focus:border-[#FAD419] outline-none transition-all placeholder:text-gray-400"
                                            placeholder="Descreva aqui o que é esperado na resposta do participante, tópicos abordados, e a lógica principal da resolução..."
                                        />
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="px-8 py-6 bg-gray-50 border-t border-gray-200 flex flex-col-reverse sm:flex-row justify-end items-center gap-4">
                        <Link
                            href="/programa-preparacao/simulados"
                            className="w-full sm:w-auto px-6 py-2.5 rounded-lg border border-gray-300 text-gray-600 font-bold text-sm hover:bg-white text-center transition-colors"
                        >
                            Cancelar
                        </Link>
                        <button
                            type="button"
                            onClick={handleSave}
                            className="w-full sm:w-auto px-8 py-2.5 rounded-lg bg-[#FAD419] text-text-main font-black text-sm shadow-sm hover:bg-[#FAD419]/90 active:scale-[0.98] transition-all text-center cursor-pointer"
                        >
                            Salvar Questão
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
