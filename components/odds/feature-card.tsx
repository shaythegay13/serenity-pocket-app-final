import { ArrowRight, LucideIcon } from "lucide-react"
import { Card } from "@/components/ui/card"

interface FeatureCardProps {
  icon: LucideIcon
  title: string
  description: string
  category?: string
  onClick: () => void
  accentColor?: "gold" | "teal" | "blue" | "purple"
}

export function FeatureCard({
  icon: Icon,
  title,
  description,
  category,
  onClick,
  accentColor = "teal"
}: FeatureCardProps) {
  const accentColors = {
    gold: "from-yellow-500/20 to-yellow-600/20 border-yellow-500/30 group-hover:border-yellow-500/60",
    teal: "from-teal-500/20 to-cyan-600/20 border-teal-500/30 group-hover:border-teal-500/60",
    blue: "from-blue-500/20 to-blue-600/20 border-blue-500/30 group-hover:border-blue-500/60",
    purple: "from-purple-500/20 to-purple-600/20 border-purple-500/30 group-hover:border-purple-500/60"
  }

  const iconColors = {
    gold: "text-yellow-500",
    teal: "text-teal-400",
    blue: "text-blue-400",
    purple: "text-purple-400"
  }

  const arrowColors = {
    gold: "text-yellow-500 group-hover:text-yellow-400",
    teal: "text-teal-500 group-hover:text-teal-400",
    blue: "text-blue-500 group-hover:text-blue-400",
    purple: "text-purple-500 group-hover:text-purple-400"
  }

  return (
    <Card
      onClick={onClick}
      className={`
        group relative cursor-pointer overflow-hidden
        bg-gradient-to-br ${accentColors[accentColor]}
        border-2 transition-all duration-300 ease-out
        hover:scale-[1.02] hover:shadow-xl hover:shadow-black/20
        p-6 h-full flex flex-col
      `}
    >
      {/* Category Badge */}
      {category && (
        <div className="absolute top-3 right-3">
          <span className="px-2 py-1 text-xs font-medium bg-black/30 rounded-full text-gray-300 backdrop-blur-sm">
            {category}
          </span>
        </div>
      )}

      {/* Icon */}
      <div className={`mb-4 ${iconColors[accentColor]}`}>
        <Icon size={32} strokeWidth={1.5} />
      </div>

      {/* Title */}
      <h3 className="text-xl font-bold text-white mb-2 tracking-tight">
        {title}
      </h3>

      {/* Description */}
      <p className="text-gray-300 text-sm leading-relaxed mb-4 flex-grow">
        {description}
      </p>

      {/* Explore Link */}
      <div className="flex items-center justify-between mt-auto">
        <span className={`text-sm font-semibold ${arrowColors[accentColor]} transition-colors`}>
          Explore
        </span>
        <ArrowRight
          size={18}
          className={`${arrowColors[accentColor]} transition-all group-hover:translate-x-1`}
        />
      </div>

      {/* Hover Glow Effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/0 to-white/0 group-hover:from-white/5 group-hover:to-white/0 transition-all duration-300 pointer-events-none" />
    </Card>
  )
}
