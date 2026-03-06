"use client";

import { ReactNode } from "react";
import { SimuladosProvider } from "./simulados/context";

export default function ProgramaPreparacaoLayout({ children }: { children: ReactNode }) {
    return (
        <SimuladosProvider>
            {children}
        </SimuladosProvider>
    );
}
