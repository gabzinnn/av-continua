import type { Metadata } from "next";
import { CandidatoProviderWrapper } from "./CandidatoProviderWrapper";

export const metadata: Metadata = {
    title: "Prova - Processo Seletivo",
    description: "Realize sua prova do processo seletivo",
};

export default function CandidatoLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <CandidatoProviderWrapper>
            <div className="min-h-screen flex flex-col bg-bg-main">
                <main className="grow flex items-center justify-center p-4 sm:p-6 lg:p-8 relative overflow-hidden">
                    {/* Decorative Background Elements */}
                    <div className="absolute top-0 left-0 w-full h-64 bg-linear-to-b from-primary/5 to-transparent -z-10"></div>
                    <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-secondary/10 rounded-full blur-3xl -z-10"></div>

                    {children}
                </main>
            </div>
        </CandidatoProviderWrapper>
    );
}
