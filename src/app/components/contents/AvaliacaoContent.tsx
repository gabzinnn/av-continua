"use client"

import { useState, useEffect, useCallback } from "react"
import { useMember } from "@/src/context/memberContext"
import { MembrosList } from "../avaliacao/MembrosList"
import { MembroHeader } from "../avaliacao/MembroHeader"
import { AvaliacaoForm } from "../avaliacao/AvaliacaoForm"
import { ConfirmarAvaliacaoModal } from "../avaliacao/ConfirmarAvaliacaoModal"
import {
  getAvaliacaoAtual,
  getRespostaExistente,
  getMembroDetalhes,
  salvarResposta,
  podeMarcar1on1
} from "@/src/actions/avaliacaoActions"
import { ClipboardList, Users } from "lucide-react"

interface MembroParaAvaliar {
  id: number
  nome: string
  fotoUrl: string | null
  area: string
  status: 'pendente' | 'rascunho' | 'concluido'
}

interface MembroDetalhes {
  id: number
  nome: string
  fotoUrl: string | null
  area: string
  periodo: string
}

interface FormData {
  notaEntrega: string
  notaCultura: string
  feedbackTexto: string
  planosAcao: string
  oneOnOneFeito: boolean
}

const initialFormData: FormData = {
  notaEntrega: "",
  notaCultura: "",
  feedbackTexto: "",
  planosAcao: "",
  oneOnOneFeito: false
}

export function AvaliacaoContent() {
  const { selectedMember, isLoading: isMemberLoading } = useMember()

  // Estado da avaliação
  const [avaliacaoId, setAvaliacaoId] = useState<number | null>(null)
  const [avaliacaoNome, setAvaliacaoNome] = useState<string | null>(null)
  const [membros, setMembros] = useState<MembroParaAvaliar[]>([])
  const [totalMembros, setTotalMembros] = useState(0)
  const [avaliadosCount, setAvaliadosCount] = useState(0)

  // Estado do membro selecionado
  const [selectedMembroId, setSelectedMembroId] = useState<number | null>(null)
  const [membroDetalhes, setMembroDetalhes] = useState<MembroDetalhes | null>(null)

  // Estado do formulário
  const [formData, setFormData] = useState<FormData>(initialFormData)
  const [isSaving, setIsSaving] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // Estado do 1:1
  const [podeMarcar1on1Checkbox, setPodeMarcar1on1Checkbox] = useState(false)

  // Estado do modal de confirmação
  const [showConfirmModal, setShowConfirmModal] = useState(false)

  // Estado de readonly (quando feedback já foi avaliado)
  const [isReadonly, setIsReadonly] = useState(false)
  const [notaFeedbackRecebida, setNotaFeedbackRecebida] = useState<number | null>(null)
  const [respostaFinalizada, setRespostaFinalizada] = useState(false)

  // Estado do drawer mobile
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)

  // Fecha drawer ao redimensionar para desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setIsDrawerOpen(false)
      }
    }
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  // Bloqueia scroll quando drawer está aberto
  useEffect(() => {
    if (isDrawerOpen) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = "unset"
    }
    return () => { document.body.style.overflow = "unset" }
  }, [isDrawerOpen])

  // Carrega dados iniciais
  const loadAvaliacaoData = useCallback(async () => {
    if (!selectedMember?.id) return

    setIsLoading(true)
    try {
      const data = await getAvaliacaoAtual(Number(selectedMember.id))
      setAvaliacaoId(data.avaliacaoId)
      setAvaliacaoNome(data.nome)
      setMembros(data.membrosParaAvaliar)
      setTotalMembros(data.totalMembros)
      setAvaliadosCount(data.avaliadosCount)

      // Seleciona o primeiro membro pendente automaticamente
      const primeiroPendente = data.membrosParaAvaliar.find(m => m.status === 'pendente')
      if (primeiroPendente) {
        setSelectedMembroId(primeiroPendente.id)
      } else if (data.membrosParaAvaliar.length > 0) {
        setSelectedMembroId(data.membrosParaAvaliar[0].id)
      }
    } catch (error) {
      console.error("Erro ao carregar avaliação:", error)
    } finally {
      setIsLoading(false)
    }
  }, [selectedMember?.id])

  useEffect(() => {
    if (!isMemberLoading) {
      loadAvaliacaoData()
    }
  }, [isMemberLoading, loadAvaliacaoData])

  // Carrega detalhes do membro selecionado
  useEffect(() => {
    async function loadMembroDetalhes() {
      if (!selectedMembroId || !avaliacaoId || !selectedMember?.id) return

      try {
        const [detalhes, respostaExistente, podeMarcar] = await Promise.all([
          getMembroDetalhes(selectedMembroId),
          getRespostaExistente(avaliacaoId, Number(selectedMember.id), selectedMembroId),
          podeMarcar1on1(Number(selectedMember.id), selectedMembroId)
        ])

        setMembroDetalhes(detalhes)
        setPodeMarcar1on1Checkbox(podeMarcar)

        if (respostaExistente) {
          setFormData({
            notaEntrega: String(respostaExistente.notaEntrega),
            notaCultura: String(respostaExistente.notaCultura),
            feedbackTexto: respostaExistente.feedbackTexto,
            planosAcao: respostaExistente.planosAcao.join("\n"),
            oneOnOneFeito: respostaExistente.oneOnOneFeito
          })
          setRespostaFinalizada(respostaExistente.finalizada)
          setNotaFeedbackRecebida(respostaExistente.notaFeedbackRecebida)
          // Readonly quando finalizada E já tem feedback avaliado
          setIsReadonly(respostaExistente.finalizada && respostaExistente.notaFeedbackRecebida !== null)
        } else {
          setFormData(initialFormData)
          setRespostaFinalizada(false)
          setNotaFeedbackRecebida(null)
          setIsReadonly(false)
        }
      } catch (error) {
        console.error("Erro ao carregar detalhes do membro:", error)
      }
    }

    loadMembroDetalhes()
  }, [selectedMembroId, avaliacaoId, selectedMember?.id])

  const handleSelectMembro = (id: number) => {
    setSelectedMembroId(id)
  }

  const handleFormChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSave = async (finalizada: boolean = false) => {
    if (!avaliacaoId || !selectedMember?.id || !selectedMembroId) return

    setIsSaving(true)
    try {
      await salvarResposta({
        avaliacaoId,
        avaliadorId: Number(selectedMember.id),
        avaliadoId: selectedMembroId,
        notaEntrega: Number(formData.notaEntrega),
        notaCultura: Number(formData.notaCultura),
        feedbackTexto: formData.feedbackTexto,
        planosAcao: formData.planosAcao.split("\n").filter(p => p.trim()),
        finalizada,
        // Só passa oneOnOneFeito se o avaliador tem permissão de marcar
        ...(podeMarcar1on1Checkbox && { oneOnOneFeito: formData.oneOnOneFeito })
      })

      // Recarrega dados para atualizar status
      await loadAvaliacaoData()
    } catch (error) {
      console.error("Erro ao salvar:", error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleSubmit = async () => {
    setShowConfirmModal(true)
  }

  const handleConfirmSubmit = async () => {
    await handleSave(true) // Finaliza a avaliação
    setShowConfirmModal(false)

    // Seleciona próximo membro pendente ou rascunho
    const proximoPendente = membros.find(m =>
      (m.status === 'pendente' || m.status === 'rascunho') && m.id !== selectedMembroId
    )
    if (proximoPendente) {
      setSelectedMembroId(proximoPendente.id)
    }
  }

  if (isMemberLoading || isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-text-muted">Carregando...</div>
      </div>
    )
  }

  if (!avaliacaoId) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-4 p-8">
        <ClipboardList size={64} className="text-gray-300" />
        <h2 className="text-xl font-bold text-text-main">Nenhuma avaliação em aberto</h2>
        <p className="text-text-muted text-center max-w-md">
          Não há nenhum ciclo de avaliação ativo no momento. Aguarde o coordenador iniciar um novo ciclo.
        </p>
      </div>
    )
  }

  const pendentesCount = totalMembros - avaliadosCount

  return (
    <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between px-4 py-3 bg-white border-b border-gray-200">
        <button
          onClick={() => setIsDrawerOpen(true)}
          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/10 text-text-main font-medium text-sm"
        >
          <Users size={18} />
          <span>Membros ({pendentesCount} pendentes)</span>
        </button>
        <div className="text-xs text-text-muted">
          {avaliadosCount}/{totalMembros} avaliados
        </div>
      </div>

      {/* Lista de membros */}
      <MembrosList
        membros={membros}
        selectedId={selectedMembroId}
        onSelect={handleSelectMembro}
        totalMembros={totalMembros}
        avaliadosCount={avaliadosCount}
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
      />

      {/* Formulário de avaliação */}
      <div className="flex-1 overflow-y-auto bg-bg-main p-6 lg:p-10">
        <div className="max-w-4xl mx-auto">
          {membroDetalhes && (
            <>
              <MembroHeader
                nome={membroDetalhes.nome}
                fotoUrl={membroDetalhes.fotoUrl}
                area={membroDetalhes.area}
                periodo={membroDetalhes.periodo}
              />

              <AvaliacaoForm
                {...formData}
                onChange={handleFormChange}
                onSave={() => handleSave(false)}
                onSubmit={handleSubmit}
                isSaving={isSaving}
                podeMarcar1on1={podeMarcar1on1Checkbox}
                on1on1Change={(checked) => handleFormChange("oneOnOneFeito", checked)}
                isReadonly={isReadonly}
                notaFeedbackRecebida={notaFeedbackRecebida}
                respostaFinalizada={respostaFinalizada}
              />
            </>
          )}
        </div>
      </div>

      {/* Modal de confirmação */}
      <ConfirmarAvaliacaoModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={handleConfirmSubmit}
        membroNome={membroDetalhes?.nome || ""}
        isLoading={isSaving}
      />
    </div>
  )
}

