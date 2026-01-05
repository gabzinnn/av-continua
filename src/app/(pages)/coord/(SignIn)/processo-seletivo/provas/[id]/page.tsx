import { ProvaFormContent } from "@/src/app/components/coords/provas/ProvaFormContent"


interface EditProvaPageProps {
    params: Promise<{ id: string }>
}

export default async function EditProvaPage({ params }: EditProvaPageProps) {
    const { id } = await params
    return <ProvaFormContent mode="edit" provaId={parseInt(id)} />
}
