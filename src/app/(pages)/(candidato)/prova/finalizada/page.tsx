"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";

function ProvaFinalizadaContent() {
    const searchParams = useSearchParams();
    const reason = searchParams.get("reason");
    const isTimeout = reason === "timeout";
    const isTabSwitch = reason === "tabswitch";

    // Determine content based on reason
    const getIcon = () => {
        if (isTimeout) return "alarm_off";
        if (isTabSwitch) return "tab_close";
        return "check_circle";
    };

    const getTitle = () => {
        if (isTimeout) return "Tempo Esgotado!";
        if (isTabSwitch) return "Prova Encerrada";
        return "Prova Finalizada";
    };

    const getMessage = () => {
        if (isTimeout) {
            return "O tempo limite da prova foi atingido. Suas respostas até o momento foram enviadas automaticamente.";
        }
        if (isTabSwitch) {
            return "Você trocou de aba mais de uma vez. A prova foi encerrada automaticamente por medida de segurança.";
        }
        return "Suas respostas foram registradas com sucesso.";
    };

    const getIconBgClass = () => {
        if (isTabSwitch) return "bg-red-500/10";
        return "bg-[#fad519]/10";
    };

    const getIconColorClass = () => {
        if (isTabSwitch) return "text-red-500";
        return "text-[#fad519]";
    };

    return (
        <div className="layout-container flex w-full h-full grow flex-col items-center justify-center p-4 sm:p-8">
            {/* Main Content Card */}
            <main className={`w-full max-w-md bg-white rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.06)] overflow-hidden border-t-8 ${isTabSwitch ? 'border-red-500' : 'border-[#fad519]'} relative animate-fade-in-up`}>
                {/* Decorative Pattern Header (Subtle) */}
                <div className={`h-2 w-full ${isTabSwitch ? 'bg-linear-to-r from-red-500 to-red-400' : 'bg-linear-to-r from-[#fad519] to-secondary'} absolute top-0 left-0`}></div>
                <div className="flex flex-col items-center text-center p-10 pt-12 space-y-6">
                    {/* Status Icon Container */}
                    <div className="relative">
                        <div className={`absolute inset-0 ${isTabSwitch ? 'bg-red-500/20' : 'bg-[#fad519]/20'} rounded-full blur-xl scale-150`}></div>
                        <div className={`relative flex items-center justify-center w-24 h-24 ${getIconBgClass()} rounded-full`}>
                            <span className={`material-symbols-outlined text-6xl ${getIconColorClass()} font-bold`}>
                                {getIcon()}
                            </span>
                        </div>
                    </div>
                    {/* Text Content */}
                    <div className="space-y-3">
                        <h1 className="text-3xl font-bold tracking-tight text-text-main">
                            {getTitle()}
                        </h1>
                        <p className={`text-base font-medium ${isTabSwitch ? 'text-red-700' : 'text-[#5c5528]'}`}>
                            {getMessage()}
                        </p>
                    </div>
                    {/* Divider */}
                    <div className={`w-16 h-1 ${isTabSwitch ? 'bg-red-500/30' : 'bg-[#fad519]/30'} rounded-full my-2`}></div>
                    {/* Helper Text */}
                    <div className={`${isTabSwitch ? 'bg-red-50 border-red-100' : 'bg-bg-main border-[#fad519]/10'} rounded-lg p-4 w-full border`}>
                        <div className="flex items-start gap-3 justify-center text-left sm:text-center">
                            <span className="material-symbols-outlined text-text-muted text-xl shrink-0 mt-0.5">
                                {isTabSwitch ? 'info' : 'lock_clock'}
                            </span>
                            <p className={`text-sm ${isTabSwitch ? 'text-red-600' : 'text-[#7e7339]'} leading-relaxed`}>
                                {isTabSwitch
                                    ? "Esta medida existe para garantir a integridade da avaliação."
                                    : "Você pode fechar esta página com segurança."}
                            </p>
                        </div>
                    </div>
                </div>
                {/* Bottom Decoration Image (Abstract) */}
                <div
                    className="h-24 w-full bg-cover bg-center opacity-10 mt-2"
                    style={{
                        backgroundImage:
                            "url('https://lh3.googleusercontent.com/aida-public/AB6AXuBZ2RiXqeBctbJOuDK26lG-bT6s3scUYyZCHyUgqycVVbv3C5p1Ka5Qz624ju2d7mraOrc-H9g5aXLHaemYYtmcokLj7_0Z3Knih1KE1om8oxw6gnfjsSn8-rJL9EivR-NiyOr-8GjCT8wx_OJSjP5odjoUHHj0HlNqbiRZg9xjZFeTx99HVmMsmdKILQ74o0fRtLeIFWGnFsialtlenGc4hCYbuX-RoE_N4zgVOBgLv6th8f4PQAsRaymArHA_3YeLejxjhmFpTw')",
                    }}
                ></div>
            </main>
            {/* Footer */}
            <footer className="mt-12 text-center opacity-60">
                <div className="flex items-center justify-center gap-2 mb-2">
                    <span className="material-symbols-outlined text-[#fad519] text-xl">
                        school
                    </span>
                    <span className="font-bold text-text-muted">
                        Prova
                    </span>
                </div>
            </footer>
        </div>
    );
}

export default function ProvaFinalizadaPage() {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-bg-main text-text-main transition-colors duration-200 font-sans">
            <Suspense fallback={<div>Carregando...</div>}>
                <ProvaFinalizadaContent />
            </Suspense>
        </div>
    );
}
