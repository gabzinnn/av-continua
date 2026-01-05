"use client"

interface DeleteProvaModalProps {
    isOpen: boolean
    onClose: () => void
    onConfirm: () => void
    provaTitulo: string
}

export function DeleteProvaModal({ isOpen, onClose, onConfirm, provaTitulo }: DeleteProvaModalProps) {
    if (!isOpen) return null

    return (
        <>
            <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose} />
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
                    <h3 className="text-lg font-bold text-text-main mb-2">Excluir Prova</h3>
                    <p className="text-text-muted mb-6">
                        Tem certeza que deseja excluir a prova <strong className="text-text-main">{provaTitulo}</strong>?
                        Esta ação não pode ser desfeita e todos os dados serão perdidos.
                    </p>
                    <div className="flex justify-end gap-3">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-text-main bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors cursor-pointer"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={onConfirm}
                            className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors cursor-pointer"
                        >
                            Excluir
                        </button>
                    </div>
                </div>
            </div>
        </>
    )
}
