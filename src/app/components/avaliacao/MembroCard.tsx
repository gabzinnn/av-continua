import { Check, FileEdit, FilePenLine } from "lucide-react"

interface MembroCardProps {
  id: number
  nome: string
  fotoUrl: string | null
  area: string
  status: 'pendente' | 'rascunho' | 'concluido'
  isSelected: boolean
  onClick: () => void
}

export function MembroCard({
  nome,
  fotoUrl,
  area,
  status,
  isSelected,
  onClick
}: MembroCardProps) {
  const isConcluido = status === 'concluido'
  const isRascunho = status === 'rascunho'
  
  const getBackgroundClass = () => {
    if (isSelected) return "bg-primary/10 border border-primary shadow-sm"
    if (isConcluido) return "bg-green-50 border border-green-200 hover:border-green-300"
    if (isRascunho) return "bg-amber-50 border border-amber-200 hover:border-amber-300"
    return "bg-white border border-transparent hover:border-gray-200 hover:bg-gray-50"
  }
  
  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        text-left p-4 rounded-xl transition-all w-full cursor-pointer
        ${getBackgroundClass()}
      `}
    >
      <div className="flex items-center gap-4">
        <div 
          className={`
            w-12 h-12 rounded-full bg-cover bg-center shrink-0
            ${!isSelected && !isConcluido ? "grayscale hover:grayscale-0" : ""} 
            transition-all
          `}
          style={{ 
            backgroundImage: fotoUrl 
              ? `url(${fotoUrl})` 
              : `url(https://ui-avatars.com/api/?name=${encodeURIComponent(nome)}&background=f9d41a&color=1c1a0d)`
          }}
        />
        <div className="flex flex-col min-w-0 flex-1">
          <span className={`
            font-bold text-sm truncate
            ${isSelected 
              ? "text-text-main" 
              : isConcluido 
                ? "text-green-700" 
                : isRascunho 
                  ? "text-amber-700" 
                  : "text-text-muted"}
          `}>
            {nome}
          </span>
          <span className={`
            text-xs truncate
            ${isConcluido 
              ? "text-green-600" 
              : isRascunho 
                ? "text-amber-600" 
                : "text-gray-400"}
          `}>
            {isConcluido ? "Avaliação concluída" : isRascunho ? "Rascunho salvo" : area}
          </span>
        </div>
        
        <div className="shrink-0">
          {isConcluido ? (
            <Check size={20} className="text-green-600" />
          ) : isRascunho ? (
            <FilePenLine size={20} className="text-amber-600" />
          ) : isSelected ? (
            <FileEdit size={20} className="text-primary" />
          ) : null}
        </div>
      </div>
    </button>
  )
}
