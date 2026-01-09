"use client"

interface TermometroQuestionCardProps {
    index: number
    texto: string
    notaSelecionada: number
    onNotaChange: (nota: number) => void
    disabled?: boolean
}

export function TermometroQuestionCard({
    index,
    texto,
    notaSelecionada,
    onNotaChange,
    disabled = false
}: TermometroQuestionCardProps) {
    const notas = [1, 2, 3, 4, 5]

    return (
        <div className="bg-bg-card p-6 md:p-8 rounded-2xl shadow-sm border border-border transition-shadow hover:shadow-md">
            <div className="flex flex-col gap-6">
                <div className="flex gap-4">
                    <span className="shrink-0 flex items-center justify-center w-8 h-8 rounded bg-gray-100 text-gray-500 text-sm font-bold font-mono">
                        {String(index + 1).padStart(2, '0')}
                    </span>
                    <div className="flex flex-col gap-1">
                        <h3 className="text-lg font-bold text-text-main leading-snug">{texto}</h3>
                    </div>
                </div>

                {/* Scale */}
                <div className="ml-12 pt-2">
                    <div className="grid grid-cols-5 gap-2 sm:gap-4">
                        {notas.map((nota) => (
                            <button
                                key={nota}
                                type="button"
                                onClick={() => !disabled && onNotaChange(nota)}
                                disabled={disabled}
                                className={`
                                    w-full aspect-square max-w-[64px] rounded-full font-medium transition-all 
                                    flex items-center justify-center
                                    focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2
                                    ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}
                                    ${notaSelecionada === nota
                                        ? 'bg-primary text-black font-bold shadow-md transform scale-110 ring-2 ring-primary ring-offset-2'
                                        : notaSelecionada > 0
                                            ? 'bg-gray-50 text-gray-500 hover:bg-primary-light/30 hover:text-black'
                                            : 'border-2 border-gray-100 bg-white text-gray-600 hover:border-primary hover:bg-primary-light/20 hover:text-black shadow-sm'
                                    }
                                `}
                            >
                                {nota}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}
