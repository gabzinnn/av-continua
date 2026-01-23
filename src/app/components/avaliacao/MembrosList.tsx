import { MembroCard } from "./MembroCard"
import { X } from "lucide-react"

interface MembroParaAvaliar {
  id: number
  nome: string
  fotoUrl: string | null
  area: string
  status: 'pendente' | 'rascunho' | 'concluido'
  feedbackAvaliado?: boolean
}

interface MembrosListProps {
  membros: MembroParaAvaliar[]
  selectedId: number | null
  onSelect: (id: number) => void
  totalMembros: number
  avaliadosCount: number
  isOpen: boolean
  onClose: () => void
}

export function MembrosList({
  membros,
  selectedId,
  onSelect,
  totalMembros,
  avaliadosCount,
  isOpen,
  onClose
}: MembrosListProps) {
  const pendentesCount = totalMembros - avaliadosCount

  const handleSelect = (id: number) => {
    onSelect(id)
    onClose() // Fecha o drawer no mobile ao selecionar
  }

  return (
    <>
      {/* Overlay para mobile */}
      {isOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black/50 z-40 backdrop-blur-sm"
          onClick={onClose}
        />
      )}

      {/* Sidebar/Drawer */}
      <div 
        className={`
          fixed md:static top-0 left-0 h-full z-50
          w-80 bg-white border-r border-gray-200 flex flex-col overflow-hidden
          transition-transform duration-300 ease-in-out
          ${isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
        `}
      >
        {/* Header com botão fechar no mobile */}
        <div className="p-6 pb-2">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-bold text-text-muted uppercase tracking-wider">
              Membros Pendentes ({pendentesCount})
            </p>
            <button 
              onClick={onClose}
              className="md:hidden p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <X size={20} className="text-gray-500" />
            </button>
          </div>
          <div className="flex items-center gap-2 text-xs text-text-muted">
            <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary rounded-full transition-all duration-500"
                style={{ width: `${totalMembros > 0 ? (avaliadosCount / totalMembros) * 100 : 0}%` }}
              />
            </div>
            <span>{avaliadosCount}/{totalMembros}</span>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto px-4 pb-6">
          <div className="flex flex-col gap-2">
            {membros.map((membro) => (
              <MembroCard
                key={membro.id}
                {...membro}
                isSelected={membro.id === selectedId}
                onClick={() => handleSelect(membro.id)}
              />
            ))}
          </div>
        </div>
      </div>
    </>
  )
}

