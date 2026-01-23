import { Loader2 } from "lucide-react"

export default function Loading() {
    return (
        <div className="flex-1 flex flex-col items-center justify-center p-8 h-full min-h-[50vh]">
            <Loader2 className="w-10 h-10 animate-spin text-primary" />
            <p className="mt-4 text-gray-500 font-medium animate-pulse">
                Gerando relatório do ciclo...
            </p>
        </div>
    )
}
