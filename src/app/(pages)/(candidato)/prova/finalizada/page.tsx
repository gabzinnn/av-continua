export default function ProvaFinalizadaPage() {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-bg-main text-text-main transition-colors duration-200 font-sans">
            <div className="layout-container flex w-full h-full grow flex-col items-center justify-center p-4 sm:p-8">
                {/* Main Content Card */}
                <main className="w-full max-w-md bg-white rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.06)] overflow-hidden border-t-8 border-[#fad519] relative animate-fade-in-up">
                    {/* Decorative Pattern Header (Subtle) */}
                    <div className="h-2 w-full bg-linear-to-r from-[#fad519] to-secondary absolute top-0 left-0"></div>
                    <div className="flex flex-col items-center text-center p-10 pt-12 space-y-6">
                        {/* Status Icon Container */}
                        <div className="relative">
                            <div className="absolute inset-0 bg-[#fad519]/20 rounded-full blur-xl scale-150"></div>
                            <div className="relative flex items-center justify-center w-24 h-24 bg-[#fad519]/10 rounded-full">
                                <span className="material-symbols-outlined text-6xl text-[#fad519] font-bold">
                                    check_circle
                                </span>
                            </div>
                        </div>
                        {/* Text Content */}
                        <div className="space-y-3">
                            <h1 className="text-3xl font-bold tracking-tight text-text-main">
                                Prova Finalizada
                            </h1>
                            <p className="text-base font-medium text-[#5c5528]">
                                Suas respostas foram registradas com sucesso.
                            </p>
                        </div>
                        {/* Divider */}
                        <div className="w-16 h-1 bg-[#fad519]/30 rounded-full my-2"></div>
                        {/* Helper Text */}
                        <div className="bg-bg-main rounded-lg p-4 w-full border border-[#fad519]/10">
                            <div className="flex items-start gap-3 justify-center text-left sm:text-center">
                                <span className="material-symbols-outlined text-text-muted text-xl shrink-0 mt-0.5">
                                    lock_clock
                                </span>
                                <p className="text-sm text-[#7e7339] leading-relaxed">
                                    Você pode fechar esta página com segurança.
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
        </div>
    );
}
