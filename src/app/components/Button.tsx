import { ButtonHTMLAttributes, ReactNode } from "react"
import { Loader2 } from "lucide-react"

type ButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "danger"
type ButtonSize = "sm" | "md" | "lg" | "xl"

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode
  variant?: ButtonVariant
  size?: ButtonSize
  icon?: ReactNode
  iconPosition?: "left" | "right"
  fullWidth?: boolean
  isLoading?: boolean
}

const variantStyles: Record<ButtonVariant, string> = {
  primary: "bg-primary hover:bg-primary-hover text-text shadow-md hover:shadow-lg",
  secondary: "bg-secondary hover:bg-secondary/80 text-text shadow-md hover:shadow-lg",
  outline: "bg-transparent border-2 border-primary text-primary hover:bg-primary hover:text-text",
  ghost: "bg-transparent text-text-muted hover:text-text",
  danger: "bg-red-600 hover:bg-red-700 text-white shadow-md hover:shadow-lg",
}

const sizeStyles: Record<ButtonSize, string> = {
  sm: "h-10 px-4 text-sm gap-2 rounded-lg",
  md: "h-12 px-5 text-base gap-2 rounded-xl",
  lg: "h-14 px-6 text-lg gap-3 rounded-xl",
  xl: "h-16 px-8 text-lg gap-3 rounded-xl",
}

export function Button({
  children,
  variant = "primary",
  size = "lg",
  icon,
  iconPosition = "right",
  fullWidth = false,
  isLoading = false,
  className = "",
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={`
        flex items-center justify-center font-bold
        transition-all hover:-translate-y-0.5
        focus:outline-none focus:ring-4 focus:ring-primary/30
        active:scale-[0.99]
        disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 cursor-pointer
        ${variantStyles[variant]}
        ${sizeStyles[size]}
        ${fullWidth ? "w-full" : ""}
        ${className}
      `}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="animate-spin" size={20} />
      ) : (
        <>
          {icon && iconPosition === "left" && icon}
          <span>{children}</span>
          {icon && iconPosition === "right" && icon}
        </>
      )}
    </button>
  )
}
