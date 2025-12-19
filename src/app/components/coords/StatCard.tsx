import { LucideIcon } from "lucide-react"

interface StatCardProps {
    title: string
    value: number | string
    subtitle?: string
    icon: LucideIcon
}

export function StatCard({ title, value, subtitle, icon: Icon }: StatCardProps) {
    return (
        <div className="bg-bg-card rounded-xl border border-border shadow-sm p-6 flex items-center justify-between relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
            <div>
                <p className="text-gray-500 text-sm font-medium uppercase tracking-wide">
                    {title}
                </p>
                <h3 className="text-4xl font-bold text-text-main mt-2">{value}</h3>
                {subtitle && (
                    <p className="text-sm text-text-muted mt-1 font-medium">{subtitle}</p>
                )}
            </div>
            <div className="w-14 h-14 rounded-full bg-primary/20 flex items-center justify-center">
                <Icon size={28} className="text-primary" />
            </div>
        </div>
    )
}
