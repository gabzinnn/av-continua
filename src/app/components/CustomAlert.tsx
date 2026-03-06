"use client";

import { ReactNode } from "react";

export type AlertType = "success" | "error" | "warning" | "info";

interface CustomAlertProps {
    isOpen: boolean;
    type: AlertType;
    title: string;
    message: string | ReactNode;
    confirmText?: string;
    cancelText?: string;
    onConfirm: () => void;
    onCancel?: () => void;
}

export function CustomAlert({
    isOpen,
    type,
    title,
    message,
    confirmText = "OK",
    cancelText = "Cancelar",
    onConfirm,
    onCancel
}: CustomAlertProps) {
    if (!isOpen) return null;

    const getIcon = () => {
        switch (type) {
            case "success": return "check_circle";
            case "error": return "error";
            case "warning": return "warning";
            case "info": return "info";
        }
    };

    const getIconColor = () => {
        switch (type) {
            case "success": return "text-green-500 bg-green-50";
            case "error": return "text-red-500 bg-red-50";
            case "warning": return "text-[#FAD419] bg-[#FCE98C]/20";
            case "info": return "text-blue-500 bg-blue-50";
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="p-6">
                    <div className="flex flex-col items-center text-center gap-4">
                        <div className={`p-4 rounded-full ${getIconColor()}`}>
                            <span className="material-symbols-outlined text-4xl leading-none">
                                {getIcon()}
                            </span>
                        </div>

                        <div>
                            <h3 className="text-xl font-black text-text-main mb-2 tracking-tight">
                                {title}
                            </h3>
                            <p className="text-gray-500 text-sm leading-relaxed">
                                {message}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="p-4 bg-gray-50 border-t border-gray-100 flex flex-col-reverse sm:flex-row justify-center gap-3">
                    {onCancel && (
                        <button
                            onClick={onCancel}
                            className="w-full sm:w-auto px-6 py-2.5 rounded-lg border border-gray-300 text-gray-600 font-bold text-sm hover:bg-white transition-colors cursor-pointer"
                        >
                            {cancelText}
                        </button>
                    )}
                    <button
                        onClick={onConfirm}
                        className={`w-full sm:w-auto px-8 py-2.5 rounded-lg font-black text-sm shadow-sm active:scale-[0.98] transition-all cursor-pointer ${type === "error"
                                ? "bg-red-500 hover:bg-red-600 text-white"
                                : type === "warning" && onCancel
                                    ? "bg-red-500 hover:bg-red-600 text-white"
                                    : "bg-[#FAD419] hover:bg-[#FAD419]/90 text-text-main"
                            }`}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
}
