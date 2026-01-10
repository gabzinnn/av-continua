"use client";

import { CandidatoProvider } from "./candidatoContext";

export function CandidatoProviderWrapper({ children }: { children: React.ReactNode }) {
    return <CandidatoProvider>{children}</CandidatoProvider>;
}
