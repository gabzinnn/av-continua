"use client";

import { ReactNode } from "react";
import { SimuladosProvider } from "@/src/contexts/simulados/context";

export default function ProgramaPreparacaoLayout({ children }: { children: ReactNode }) {
    return (
        <SimuladosProvider>
            {children}
        </SimuladosProvider>
    );
}
