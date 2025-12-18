import Image from "next/image"

interface UserCardProps {
  nome: string
  area: string
  foto: string | null
  compact?: boolean
}

export function UserCard({ nome, area, foto, compact = false }: UserCardProps) {
  return (
    <div className="flex items-center gap-3">
      <div 
        className={`
          relative rounded-full overflow-hidden border-2 border-primary shrink-0
          ${compact ? "w-10 h-10" : "w-12 h-12"}
        `}
      >
        {foto ? (
          <Image
            src={foto}
            alt={nome}
            fill
            className="object-cover"
          />
        ) : (
          <div className="w-full h-full bg-[#f3f4f6] flex items-center justify-center">
            <span className={`material-symbols-outlined text-[#9ca3af] ${compact ? "text-[18px]" : "text-[24px]"}`}>
              person
            </span>
          </div>
        )}
      </div>

      {!compact && (
        <div className="flex flex-col min-w-0">
          <h2 className="text-sm font-bold text-[#111827] truncate">{nome}</h2>
          <p className="text-xs text-[#6b7280] truncate">{area}</p>
        </div>
      )}
    </div>
  )
}