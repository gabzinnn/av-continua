import { SelectHTMLAttributes } from "react"

type SelectSize = "sm" | "md" | "lg"

interface SelectOption {
  value: string
  label: string
}

interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, "size"> {
  label?: string
  options: SelectOption[]
  placeholder?: string
  size?: SelectSize
  helperText?: string
  error?: string
}

const sizeStyles: Record<SelectSize, string> = {
  sm: "px-3 py-2 text-sm",
  md: "px-4 py-3 text-base",
  lg: "px-4 py-4 text-lg",
}

export function Select({
  label,
  options,
  placeholder = "Selecione...",
  size = "lg",
  helperText,
  error,
  className = "",
  ...props
}: SelectProps) {
  return (
    <div className="w-full">
      {label && (
        <label className="text-text text-sm font-semibold mb-3 flex items-center gap-2 uppercase tracking-wider">
          <span className="material-symbols-outlined text-primary text-lg">badge</span>
          {label}
        </label>
      )}

      <div className="relative group">
        <select
          className={`
            w-full appearance-none rounded-xl
            border bg-bg
            text-text placeholder-text-muted font-medium
            focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none
            transition-all cursor-pointer
            ${error ? "border-red-500" : "border-border-input"}
            ${sizeStyles[size]}
            ${className}
          `}
          {...props}
        >
          <option disabled value="">
            {placeholder}
          </option>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-text-muted group-hover:text-primary transition-colors">
          <span className="material-symbols-outlined">expand_more</span>
        </div>
      </div>

      {(helperText || error) && (
        <div className={`mt-3 flex items-center gap-2 text-xs ${error ? "text-red-500" : "text-text-muted"}`}>
          <span className="material-symbols-outlined text-[16px]">info</span>
          <span>{error || helperText}</span>
        </div>
      )}
    </div>
  )
}