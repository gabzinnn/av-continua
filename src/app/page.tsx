import Image from "next/image"
import { getActiveMembers } from "@/src/actions/membroActions"
import { MemberForm } from "./components/MemberForm"

export const dynamic = "force-dynamic";

export default async function Home() {
  const memberOptions = await getActiveMembers()

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-125 flex flex-col items-center gap-8">
        <div className="flex flex-col items-center gap-4">
          <Image
            src="/assets/images/logoCompletaFundoBranco.png"
            alt="Logo do Clube"
            width={200}
            height={48}
            className="h-auto"
          />
          <div className="text-center space-y-2 mt-2">
            <h1 className="text-text text-2xl font-bold tracking-tight text-text-main">
              Avaliação Contínua
            </h1>
            <p className="text-text-muted text-lg font-medium">
              Selecione qual membro você é
            </p>
          </div>
        </div>

        <MemberForm options={memberOptions} />
      </div>
    </main>
  )
}