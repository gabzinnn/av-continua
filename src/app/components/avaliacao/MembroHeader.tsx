interface MembroHeaderProps {
  nome: string
  fotoUrl: string | null
  area: string
  periodo: string
}

export function MembroHeader({ nome, fotoUrl, area, periodo }: MembroHeaderProps) {
  return (
    <div className="flex items-center gap-6 mb-8 pb-8 border-b border-gray-200">
      <div 
        className="w-24 h-24 rounded-full bg-cover bg-center border-4 border-white shadow-md shrink-0"
        style={{ 
          backgroundImage: fotoUrl 
            ? `url(${fotoUrl})` 
            : `url(https://ui-avatars.com/api/?name=${encodeURIComponent(nome)}&background=f9d41a&color=1c1a0d&size=200)`
        }}
      />
      <div className="flex flex-col">
        <h3 className="text-3xl font-black text-text-main tracking-tight">
          {nome}
        </h3>
        <p className="text-lg text-text-muted">{area}</p>
        <div className="flex gap-2 mt-3">
          <span className="inline-flex items-center rounded-md bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600 ring-1 ring-inset ring-gray-500/10">
            Período: {periodo}
          </span>
        </div>
      </div>
    </div>
  )
}
