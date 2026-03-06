"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSimuladoSession } from "@/src/app/(externo)/context";

export default function SimuladoConfigPage() {
    const { iniciarSessao } = useSimuladoSession();
    const router = useRouter();

    const [nome, setNome] = useState("");
    const [email, setEmail] = useState("");
    const [tipo, setTipo] = useState("Geral");
    const [dificuldade, setDificuldade] = useState("");
    const [qtdQuestoes, setQtdQuestoes] = useState<number | "">("");

    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleGerarSimulado = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (!nome.trim() || !email.trim() || !tipo || !qtdQuestoes) {
            setError("Por favor, preencha todos os campos obrigatórios.");
            return;
        }

        const qtd = Number(qtdQuestoes);
        if (isNaN(qtd) || qtd <= 0) {
            setError("Número de questões inválido.");
            return;
        }

        setLoading(true);
        try {
            const sessionId = await iniciarSessao(
                nome,
                email,
                tipo,
                dificuldade || undefined,
                qtd
            );

            if (sessionId) {
                router.push(`/simulado/${sessionId}`);
            } else {
                setError("Não há questões suficientes no banco para este filtro. Diminua a quantidade ou mude o filtro.");
            }
        } catch (err) {
            console.error(err);
            setError("Erro ao criar sessão de simulado. Tente novamente.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full flex-1 flex items-center justify-center p-4 py-12 md:py-24">
            <div className="bg-white rounded-[24px] shadow-sm border border-gray-100 w-full max-w-md overflow-hidden relative">

                {/* Decoration Header */}
                <div className="bg-gradient-to-r from-yellow-50 to-[#FCE98C]/30 p-8 flex flex-col items-center justify-center border-b border-gray-100">
                    <div className="bg-white p-4 rounded-2xl shadow-sm mb-4">
                        <span className="material-symbols-outlined text-[#FAD419] text-3xl">assignment_ind</span>
                    </div>
                    <span className="text-[10px] uppercase font-black tracking-widest text-[#FAD419] bg-white px-3 py-1 rounded-full shadow-sm">
                        Plataforma Externa
                    </span>
                </div>

                <div className="p-8">
                    <div className="text-center mb-8">
                        <h1 className="text-2xl font-black text-text-main mb-2 tracking-tight">
                            Simulados de Preparação
                        </h1>
                        <p className="text-gray-500 text-sm">
                            Identifique-se para configurar sua sessão de estudos
                        </p>
                    </div>

                    {error && (
                        <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-xl text-sm font-semibold flex items-center gap-2">
                            <span className="material-symbols-outlined text-red-500">error</span>
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleGerarSimulado} className="space-y-5">
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-gray-700 uppercase tracking-wider block">Nome Completo</label>
                            <div className="relative">
                                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-[20px]">person</span>
                                <input
                                    type="text"
                                    value={nome}
                                    onChange={(e) => setNome(e.target.value)}
                                    className="w-full bg-gray-50/50 border border-gray-200 rounded-xl py-3.5 pl-11 pr-4 text-sm text-text-main focus:ring-2 focus:ring-[#FAD419] focus:border-[#FAD419] transition-all outline-none placeholder:text-gray-400"
                                    placeholder="Seu nome completo"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-gray-700 uppercase tracking-wider block">E-mail Acadêmico</label>
                            <div className="relative">
                                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-[20px]">alternate_email</span>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full bg-gray-50/50 border border-gray-200 rounded-xl py-3.5 pl-11 pr-4 text-sm text-text-main focus:ring-2 focus:ring-[#FAD419] focus:border-[#FAD419] transition-all outline-none placeholder:text-gray-400"
                                    placeholder="exemplo@ufrj.br"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-gray-700 uppercase tracking-wider block">Tipo de Simulado Desejado</label>
                            <div className="relative">
                                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-[20px]">category</span>
                                <select
                                    value={tipo}
                                    onChange={(e) => setTipo(e.target.value)}
                                    className="w-full bg-gray-50/50 border border-gray-200 rounded-xl py-3.5 pl-11 pr-4 text-sm text-text-main focus:ring-2 focus:ring-[#FAD419] focus:border-[#FAD419] transition-all outline-none appearance-none"
                                    required
                                >
                                    <option value="Geral">Simulado Geral (Misto)</option>
                                    <option value="GMAT">Simulado de Matemática (GMAT)</option>
                                    <option value="Business Case">Simulado de Business Case</option>
                                </select>
                                <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none text-[20px]">keyboard_arrow_down</span>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-gray-700 uppercase tracking-wider block">Dificuldade</label>
                                <select
                                    value={dificuldade}
                                    onChange={(e) => setDificuldade(e.target.value)}
                                    className="w-full bg-gray-50/50 border border-gray-200 rounded-xl py-3.5 px-4 text-sm text-text-main focus:ring-2 focus:ring-[#FAD419] focus:border-[#FAD419] transition-all outline-none appearance-none"
                                >
                                    <option value="">Qualquer</option>
                                    <option value="Fácil">Fácil</option>
                                    <option value="Médio">Médio</option>
                                    <option value="Difícil">Difícil</option>
                                </select>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-gray-700 uppercase tracking-wider block">Qtd. Questões</label>
                                <div className="relative">
                                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-[18px]">format_list_numbered</span>
                                    <input
                                        type="number"
                                        min="1"
                                        max="100"
                                        value={qtdQuestoes}
                                        onChange={(e) => setQtdQuestoes(e.target.value ? Number(e.target.value) : "")}
                                        className="w-full bg-gray-50/50 border border-gray-200 rounded-xl py-3.5 pl-9 pr-3 text-sm text-text-main focus:ring-2 focus:ring-[#FAD419] focus:border-[#FAD419] transition-all outline-none placeholder:text-gray-400"
                                        placeholder="Ex: 10"
                                        required
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="pt-4">
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-4 rounded-xl bg-[#FAD419] hover:bg-[#FAD419]/90 text-text-main font-black text-base shadow-sm active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                            >
                                {loading ? "Gerando..." : "Gerar Simulado"}
                                {!loading && <span className="material-symbols-outlined text-xl">rocket_launch</span>}
                            </button>
                        </div>
                    </form>
                </div>

                {/* Status Footer */}
                <div className="bg-gray-50 border-t border-gray-100 p-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Servidor Online</span>
                    </div>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">v2.2.0 - Internal</span>
                </div>
            </div>
        </div>
    );
}
