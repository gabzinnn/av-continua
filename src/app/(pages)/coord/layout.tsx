import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Gestão CC",
    description: "Site responsável por gerenciar a gestão de coordenadores",
};

export const dynamic = "force-dynamic";

export default function CoordsLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return <>{children}</>
}
