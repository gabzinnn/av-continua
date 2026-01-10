"use client";

import { useState, useRef, useEffect } from "react";

interface Option {
    value: string;
    label: string;
}

interface SearchableSelectProps {
    id?: string;
    name?: string;
    label?: string;
    placeholder?: string;
    options: readonly Option[];
    value: string;
    onChange: (value: string) => void;
    icon?: string;
    error?: string;
}

export function SearchableSelect({
    id,
    name,
    label,
    placeholder = "Selecione...",
    options,
    value,
    onChange,
    icon,
    error,
}: SearchableSelectProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState("");
    const containerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const selectedOption = options.find((opt) => opt.value === value);

    const filteredOptions = options.filter((opt) =>
        opt.label.toLowerCase().includes(search.toLowerCase())
    );

    // Fechar ao clicar fora
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
                setSearch("");
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleSelect = (optionValue: string) => {
        onChange(optionValue);
        setIsOpen(false);
        setSearch("");
    };

    const handleInputClick = () => {
        setIsOpen(true);
        setTimeout(() => inputRef.current?.focus(), 0);
    };

    return (
        <div className="flex flex-col gap-2 w-full" ref={containerRef}>
            {label && (
                <label className="text-sm font-medium text-text-main" htmlFor={id}>
                    {label}
                </label>
            )}

            <div className="relative">
                {/* Display field */}
                <div
                    className={`
            w-full h-12 px-4 rounded-lg bg-stone-50 border
            text-text-main cursor-pointer
            flex items-center justify-between
            transition-all duration-200
            ${isOpen ? "border-primary ring-4 ring-primary/20" : "border-stone-200"}
            ${error ? "border-red-500" : ""}
          `}
                    onClick={handleInputClick}
                >
                    {isOpen ? (
                        <input
                            ref={inputRef}
                            type="text"
                            className="w-full bg-transparent outline-none placeholder:text-text-muted"
                            placeholder="Buscar curso..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            onClick={(e) => e.stopPropagation()}
                        />
                    ) : (
                        <span className={selectedOption ? "text-text-main" : "text-text-muted"}>
                            {selectedOption?.label || placeholder}
                        </span>
                    )}
                    <span className="material-symbols-outlined text-text-muted text-[20px]">
                        {isOpen ? "search" : "expand_more"}
                    </span>
                </div>

                {/* Hidden input for form submission */}
                <input type="hidden" name={name} value={value} />

                {/* Dropdown */}
                {isOpen && (
                    <div className="absolute z-50 w-full mt-1 bg-white border border-stone-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                        {filteredOptions.length === 0 ? (
                            <div className="px-4 py-3 text-text-muted text-sm">
                                Nenhum curso encontrado
                            </div>
                        ) : (
                            filteredOptions.map((option) => (
                                <div
                                    key={option.value}
                                    className={`
                    px-4 py-3 cursor-pointer text-sm
                    hover:bg-primary/10 transition-colors
                    ${option.value === value ? "bg-primary/20 font-medium" : ""}
                  `}
                                    onClick={() => handleSelect(option.value)}
                                >
                                    {option.label}
                                </div>
                            ))
                        )}
                    </div>
                )}
            </div>

            {error && (
                <div className="flex items-center gap-2 text-xs text-red-500">
                    <span className="material-symbols-outlined text-[16px]">error</span>
                    <span>{error}</span>
                </div>
            )}
        </div>
    );
}
