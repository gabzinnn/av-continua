import { InputHTMLAttributes } from "react";

type InputSize = "sm" | "md" | "lg";

interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "size"> {
    label?: string;
    icon?: string;
    size?: InputSize;
    helperText?: string;
    error?: string;
}

const sizeStyles: Record<InputSize, string> = {
    sm: "h-10 px-3 text-sm",
    md: "h-11 px-4 text-base",
    lg: "h-12 px-4 text-base",
};

export function Input({
    label,
    icon,
    size = "lg",
    helperText,
    error,
    className = "",
    id,
    ...props
}: InputProps) {
    return (
        <div className="flex flex-col gap-2 w-full">
            {label && (
                <label
                    className="text-sm font-medium text-text-main"
                    htmlFor={id}
                >
                    {label}
                </label>
            )}

            <div className="relative">
                <input
                    id={id}
                    className={`
            w-full rounded-lg bg-stone-50 border
            text-text-main placeholder:text-text-muted
            focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/20
            transition-all duration-200
            ${error ? "border-red-500" : "border-stone-200"}
            ${icon ? "pr-10" : ""}
            ${sizeStyles[size]}
            ${className}
          `}
                    {...props}
                />
                {icon && (
                    <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none text-[20px]">
                        {icon}
                    </span>
                )}
            </div>

            {(helperText || error) && (
                <div className={`flex items-center gap-2 text-xs ${error ? "text-red-500" : "text-text-muted"}`}>
                    <span className="material-symbols-outlined text-[16px]">info</span>
                    <span>{error || helperText}</span>
                </div>
            )}
        </div>
    );
}
