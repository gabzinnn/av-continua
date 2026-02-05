"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import { useMember } from "@/src/context/memberContext"
import { Button } from "./Button"
import { Card } from "./Card"
import { Select } from "./Select"

interface MemberOption {
  value: string
  label: string
  area: string
  foto: string | null
}

interface MemberFormProps {
  options: MemberOption[]
}

export function MemberForm({ options }: MemberFormProps) {
  const [selectedId, setSelectedId] = useState("")
  const { selectMember } = useMember()
  const router = useRouter()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const member = options.find((m) => m.value === selectedId)
    if (!member) return

    selectMember({
      id: member.value,
      nome: member.label,
      area: member.area,
      foto: member.foto,
    })

    router.push("/home")
  }

  return (
    <form onSubmit={handleSubmit} className="w-full flex flex-col gap-6">
      <Card>
        <Select
          name="member"
          label="Identificação"
          options={options}
          placeholder="Toque para selecionar..."
          value={selectedId}
          onChange={(e) => setSelectedId(e.target.value)}
          helperText="Seu acesso será registrado automaticamente."
          secretLinkHref="/coord"
        />
      </Card>

      <Button
        type="submit"
        size="xl"
        fullWidth
        disabled={!selectedId}
        icon={<span className="material-symbols-outlined">arrow_forward</span>}
      >
        Continuar Acesso
      </Button>
    </form>
  )
}