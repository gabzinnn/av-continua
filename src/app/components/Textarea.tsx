import { TextareaHTMLAttributes } from "react"

type TextareaSize = "sm" | "md" | "lg"

interface TextareaProps extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "size"> {
  label?: string
  size?: TextareaSize
  helperText?: string
  error?: string
}

const sizeStyles: Record<TextareaSize, string> = {
  sm: "px-3 py-2 text-sm",
  md: "px-4 py-3 text-base",
  lg: "px-4 py-4 text-lg",
}

export function Textarea({
  label,
  size = "md",
  helperText,
  error,
  className = "",
  rows = 4,
  ...props
}: TextareaProps) {
  return (
    <div className="w-full">
      {label && (
        <label className="text-text text-sm font-semibold mb-2 block">
          {label}
        </label>
      )}

      <textarea
        rows={rows}
        className={`
          w-full rounded-xl resize-none
          border bg-bg
          text-text placeholder-text-muted
          focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none
          transition-all
          ${error ? "border-red-500" : "border-gray-300"}
          ${sizeStyles[size]}
          ${className}
        `}
        {...props}
      />

      {(helperText || error) && (
        <div className={`mt-2 text-xs ${error ? "text-red-500" : "text-text-muted"}`}>
          {error || helperText}
        </div>
      )}
    </div>
  )
}
