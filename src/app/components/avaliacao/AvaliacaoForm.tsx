"use client"

import { Card } from "../Card"
import { Select } from "../Select"
import { Textarea } from "@/src/app/components/Textarea"
import { Button } from "../Button"
import { NOTAS_OPTIONS, notaParaTexto, getNotaBorderColor, FEEDBACK_OPTIONS } from "@/src/utils/notas"
import { BarChart3, MessageSquare, Flag, Save, ArrowRight, UserCheck, Lock, Star } from "lucide-react"

interface AvaliacaoFormProps {
  notaEntrega: string
  notaCultura: string
  feedbackTexto: string
  planosAcao: string
  oneOnOneFeito: boolean
  onChange: (field: string, value: string) => void
  onSave: () => void
  onSubmit: () => void
  isSaving: boolean
  podeMarcar1on1?: boolean
  on1on1Change?: (checked: boolean) => void
  isReadonly?: boolean
  notaFeedbackRecebida?: number | null
  respostaFinalizada?: boolean
}

export function AvaliacaoForm({
  notaEntrega,
  notaCultura,
  feedbackTexto,
  planosAcao,
  oneOnOneFeito,
  onChange,
  onSave,
  onSubmit,
  isSaving,
  podeMarcar1on1 = false,
  on1on1Change,
  isReadonly = false,
  notaFeedbackRecebida = null,
  respostaFinalizada = false
}: AvaliacaoFormProps) {
  const isFormValid = notaEntrega && notaCultura && feedbackTexto.trim() && planosAcao.trim()

  const getFeedbackLabel = (nota: number): string => {
    const option = FEEDBACK_OPTIONS.find(opt => Number(opt.value) === nota)
    return option?.label || "Avaliado"
  }

  return (
    <form className="space-y-8" onSubmit={(e) => { e.preventDefault(); if (!isReadonly) onSubmit(); }}>
      {/* Banner de avaliação bloqueada */}
      {isReadonly && (
        <Card className="bg-amber-50 border-amber-200">
          <div className="flex items-start gap-4">
            <div className="p-2 bg-amber-100 rounded-full shrink-0">
              <Lock size={20} className="text-amber-600" />
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-bold text-amber-800 mb-1">
                Avaliação bloqueada
              </h4>
              <p className="text-xs text-amber-700">
                Esta avaliação foi finalizada e já recebeu feedback do destinatário.
                Não é possível editar os campos.
              </p>
              {notaFeedbackRecebida !== null && (
                <div className="mt-3 flex items-center gap-2">
                  <Star size={16} className="text-amber-600" fill="currentColor" />
                  <span className="text-sm font-medium text-amber-800">
                    Nota recebida: {getFeedbackLabel(notaFeedbackRecebida)}
                  </span>
                </div>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* Banner de avaliação finalizada mas ainda não avaliada */}
      {respostaFinalizada && !isReadonly && (
        <Card className="bg-blue-50 border-blue-200">
          <div className="flex items-start gap-4">
            <div className="p-2 bg-blue-100 rounded-full shrink-0">
              <ArrowRight size={20} className="text-blue-600" />
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-bold text-blue-800 mb-1">
                Avaliação enviada
              </h4>
              <p className="text-xs text-blue-700">
                Esta avaliação já foi finalizada e enviada. Você ainda pode editar até que o destinatário avalie o feedback.
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Métricas Principais */}
      <Card>
        <h4 className="text-lg font-bold text-text-main mb-6 flex items-center gap-2">
          <BarChart3 size={20} className="text-primary" />
          Métricas Principais
        </h4>

        {isReadonly ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className={`flex flex-col gap-1 border-l-2 ${getNotaBorderColor(Number(notaEntrega))} pl-3`}>
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Entrega</span>
              <span className="font-bold text-gray-900">{notaParaTexto(Number(notaEntrega))}</span>
            </div>
            <div className={`flex flex-col gap-1 border-l-2 ${getNotaBorderColor(Number(notaCultura))} pl-3`}>
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Alinhamento Cultural</span>
              <span className="font-bold text-gray-900">{notaParaTexto(Number(notaCultura))}</span>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Select
              label="Entrega"
              name="notaEntrega"
              options={NOTAS_OPTIONS}
              value={notaEntrega}
              onChange={(e) => onChange("notaEntrega", e.target.value)}
              placeholder="Selecione uma opção"
              size="md"
              helperText="Avaliação técnica e de prazos."
            />
            <Select
              label="Alinhamento com a Cultura"
              name="notaCultura"
              options={NOTAS_OPTIONS}
              value={notaCultura}
              onChange={(e) => onChange("notaCultura", e.target.value)}
              placeholder="Selecione uma opção"
              size="md"
              helperText="Baseado nos valores do clube."
            />
          </div>
        )}
      </Card>

      {/* Feedback Detalhado */}
      <Card>
        <h4 className="text-lg font-bold text-text-main mb-4 flex items-center gap-2">
          <MessageSquare size={20} className="text-primary" />
          Feedback Detalhado
        </h4>

        {isReadonly ? (
          <p className="text-text-main text-base font-normal leading-relaxed whitespace-pre-line">
            {feedbackTexto}
          </p>
        ) : (
          <Textarea
            name="feedbackTexto"
            value={feedbackTexto}
            onChange={(e) => onChange("feedbackTexto", e.target.value)}
            placeholder="Descreva os pontos fortes e áreas de melhoria observados na última quinzena"
            rows={6}
            size="md"
          />
        )}
      </Card>

      {/* Planos de Ação */}
      <Card>
        <h4 className="text-lg font-bold text-text-main mb-4 flex items-center gap-2">
          <Flag size={20} className="text-primary" />
          Planos de Ação e Metas
        </h4>

        {isReadonly ? (
          <p className="text-text-main text-base font-normal leading-relaxed whitespace-pre-line">
            {planosAcao}
          </p>
        ) : (
          <Textarea
            name="planosAcao"
            value={planosAcao}
            onChange={(e) => onChange("planosAcao", e.target.value)}
            placeholder="Defina os próximos passos e objetivos. Escreva um plano por linha."
            rows={4}
            size="md"
            helperText="Escreva um plano de ação por linha. Exemplo: Participar de mais reuniões de alinhamento"
          />
        )}
      </Card>

      {/* 1:1 Checkbox - Só aparece se tem permissão e não é readonly */}
      {podeMarcar1on1 && !isReadonly && (
        <Card>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={oneOnOneFeito}
                onChange={(e) => on1on1Change?.(e.target.checked)}
                className="w-5 h-5 text-primary focus:ring-primary border-gray-300 rounded cursor-pointer"
              />
              <div className="flex items-center gap-2">
                <UserCheck size={20} className="text-primary" />
                <span className="text-sm font-bold text-text-main group-hover:text-primary transition-colors">
                  1:1 realizado com este membro
                </span>
              </div>
            </label>
          </div>
          <p className="text-xs text-text-muted mt-2">
            Marque esta opção após realizar a reunião individual de feedback com o membro.
          </p>
        </Card>
      )}

      {/* 1:1 Status - Modo readonly */}
      {podeMarcar1on1 && isReadonly && oneOnOneFeito && (
        <Card className="bg-green-50 border-green-200">
          <div className="flex items-center gap-3">
            <UserCheck size={20} className="text-green-600" />
            <span className="text-sm font-medium text-green-800">
              1:1 realizado com este membro
            </span>
          </div>
        </Card>
      )}

      {/* Action Bar - Só aparece se não é readonly */}
      {!isReadonly && (
        <div className="flex items-center justify-between pt-4 pb-12">
          <button
            type="button"
            onClick={onSave}
            disabled={isSaving}
            className="text-text-muted hover:text-text-main font-semibold text-sm transition-colors flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 cursor-pointer"
          >
            <Save size={18} />
            {isSaving ? "Salvando..." : "Salvar como Rascunho"}
          </button>

          <Button
            type="submit"
            disabled={!isFormValid || isSaving}
            icon={<ArrowRight size={18} />}
          >
            Finalizar Avaliação
          </Button>
        </div>
      )}
    </form>
  )
}
