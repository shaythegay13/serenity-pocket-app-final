"use client"

import { cn } from "@/lib/utils"

interface ArchetypeAvatarProps {
  archetype?: string
  size?: "sm" | "md" | "lg" | "xl" | "responsive"
  className?: string
}

// Map display names to archetype IDs
function getArchetypeId(archetype?: string): string {
  if (!archetype) return "default"

  const normalized = archetype.toLowerCase()

  if (normalized.includes("analyst")) return "analyst"
  if (normalized.includes("emotional")) return "emotional_bettor"
  if (normalized.includes("thrill")) return "thrill_seeker"
  if (normalized.includes("social")) return "social_bettor"
  if (normalized.includes("escape")) return "escape_artist"
  if (normalized.includes("risk") || normalized.includes("controller")) return "risk_controller"
  if (normalized.includes("big") || normalized.includes("spender")) return "big_spender"
  if (normalized.includes("superfan") || normalized.includes("fan")) return "superfan"
  if (normalized.includes("aspiring") || normalized.includes("pro")) return "aspiring_pro"
  if (normalized.includes("casual") || normalized.includes("dabbler")) return "casual_dabbler"

  return "default"
}

const sizeClasses = {
  sm: "h-8 w-8",
  md: "h-10 w-10",
  lg: "h-16 w-16",
  xl: "h-20 w-20",
  // Responsive: scales from mobile (48px) -> tablet (64px) -> desktop (80px) -> large desktop (96px)
  responsive: "h-12 w-12 sm:h-16 sm:w-16 md:h-20 md:w-20 lg:h-24 lg:w-24"
}

// SVG caricature for The Analyst - glasses, analytical expression
function AnalystAvatar() {
  return (
    <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="32" cy="32" r="30" fill="#1E3A5F"/>
      <circle cx="32" cy="28" r="16" fill="#FFD7BA"/>
      <ellipse cx="32" cy="42" rx="14" ry="10" fill="#2563EB"/>
      {/* Glasses */}
      <rect x="18" y="24" width="10" height="8" rx="2" fill="none" stroke="#1F2937" strokeWidth="2"/>
      <rect x="36" y="24" width="10" height="8" rx="2" fill="none" stroke="#1F2937" strokeWidth="2"/>
      <line x1="28" y1="28" x2="36" y2="28" stroke="#1F2937" strokeWidth="2"/>
      {/* Eyes behind glasses */}
      <circle cx="23" cy="28" r="2" fill="#1F2937"/>
      <circle cx="41" cy="28" r="2" fill="#1F2937"/>
      {/* Thoughtful expression */}
      <path d="M28 36 Q32 38 36 36" stroke="#8B5A3C" strokeWidth="1.5" fill="none"/>
      {/* Hair */}
      <path d="M18 20 Q22 12 32 12 Q42 12 46 20" fill="#4A3728"/>
      {/* Chart icon */}
      <rect x="44" y="46" width="10" height="8" rx="1" fill="#10B981"/>
      <path d="M46 52 L48 49 L50 51 L52 47" stroke="white" strokeWidth="1.5" fill="none"/>
    </svg>
  )
}

// SVG caricature for The Emotional Bettor - expressive, heart-driven
function EmotionalBettorAvatar() {
  return (
    <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="32" cy="32" r="30" fill="#7C3AED"/>
      <circle cx="32" cy="28" r="16" fill="#FFD7BA"/>
      <ellipse cx="32" cy="42" rx="14" ry="10" fill="#A855F7"/>
      {/* Expressive eyes */}
      <ellipse cx="26" cy="26" rx="3" ry="4" fill="#1F2937"/>
      <ellipse cx="38" cy="26" rx="3" ry="4" fill="#1F2937"/>
      <circle cx="27" cy="25" r="1" fill="white"/>
      <circle cx="39" cy="25" r="1" fill="white"/>
      {/* Emotional expression - worried/excited */}
      <path d="M26 34 Q32 38 38 34" stroke="#8B5A3C" strokeWidth="2" fill="none"/>
      {/* Eyebrows showing emotion */}
      <path d="M22 22 Q26 20 28 22" stroke="#4A3728" strokeWidth="1.5" fill="none"/>
      <path d="M36 22 Q38 20 42 22" stroke="#4A3728" strokeWidth="1.5" fill="none"/>
      {/* Hair */}
      <path d="M16 22 Q20 10 32 10 Q44 10 48 22" fill="#8B4513"/>
      {/* Heart symbols */}
      <path d="M10 14 C8 12 6 14 8 17 L10 20 L12 17 C14 14 12 12 10 14" fill="#EF4444"/>
      <path d="M52 18 C50 16 48 18 50 21 L52 24 L54 21 C56 18 54 16 52 18" fill="#EF4444"/>
    </svg>
  )
}

// SVG caricature for The Thrill Seeker - excited, lightning energy
function ThrillSeekerAvatar() {
  return (
    <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="32" cy="32" r="30" fill="#DC2626"/>
      <circle cx="32" cy="28" r="16" fill="#FFD7BA"/>
      <ellipse cx="32" cy="42" rx="14" ry="10" fill="#F59E0B"/>
      {/* Excited eyes */}
      <circle cx="26" cy="26" r="3" fill="#1F2937"/>
      <circle cx="38" cy="26" r="3" fill="#1F2937"/>
      <circle cx="27" cy="25" r="1.5" fill="white"/>
      <circle cx="39" cy="25" r="1.5" fill="white"/>
      {/* Big excited smile */}
      <path d="M24 34 Q32 42 40 34" stroke="#8B5A3C" strokeWidth="2" fill="none"/>
      <path d="M26 36 Q32 40 38 36" fill="white"/>
      {/* Raised eyebrows */}
      <path d="M22 20 L28 18" stroke="#4A3728" strokeWidth="2"/>
      <path d="M36 18 L42 20" stroke="#4A3728" strokeWidth="2"/>
      {/* Spiky excited hair */}
      <path d="M20 18 L24 8 L28 16 L32 6 L36 16 L40 8 L44 18" fill="#FFA500"/>
      {/* Lightning bolts */}
      <path d="M8 24 L12 20 L10 26 L14 22" stroke="#FBBF24" strokeWidth="2" fill="#FBBF24"/>
      <path d="M50 26 L54 22 L52 28 L56 24" stroke="#FBBF24" strokeWidth="2" fill="#FBBF24"/>
    </svg>
  )
}

// SVG caricature for The Social Bettor - friendly, multiple people vibe
function SocialBettorAvatar() {
  return (
    <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="32" cy="32" r="30" fill="#0EA5E9"/>
      {/* Main person */}
      <circle cx="32" cy="26" r="14" fill="#FFD7BA"/>
      <ellipse cx="32" cy="40" rx="12" ry="10" fill="#3B82F6"/>
      {/* Friendly eyes */}
      <circle cx="28" cy="24" r="2" fill="#1F2937"/>
      <circle cx="36" cy="24" r="2" fill="#1F2937"/>
      {/* Warm smile */}
      <path d="M26 32 Q32 38 38 32" stroke="#8B5A3C" strokeWidth="2" fill="none"/>
      {/* Hair */}
      <path d="M20 18 Q24 10 32 10 Q40 10 44 18" fill="#6B4423"/>
      {/* Friend silhouettes */}
      <circle cx="12" cy="32" r="8" fill="#1E40AF" opacity="0.7"/>
      <circle cx="12" cy="26" r="5" fill="#E8D4C4" opacity="0.8"/>
      <circle cx="52" cy="32" r="8" fill="#1E40AF" opacity="0.7"/>
      <circle cx="52" cy="26" r="5" fill="#D4C4B4" opacity="0.8"/>
      {/* Chat bubbles */}
      <ellipse cx="48" cy="14" rx="6" ry="4" fill="white"/>
      <path d="M44 16 L42 20 L46 17" fill="white"/>
    </svg>
  )
}

// SVG caricature for The Escape Artist - dreamy, floating away
function EscapeArtistAvatar() {
  return (
    <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="32" cy="32" r="30" fill="#6366F1"/>
      <circle cx="32" cy="28" r="16" fill="#FFD7BA"/>
      <ellipse cx="32" cy="42" rx="14" ry="10" fill="#818CF8"/>
      {/* Dreamy half-closed eyes */}
      <path d="M23 26 Q26 28 29 26" stroke="#1F2937" strokeWidth="2" fill="none"/>
      <path d="M35 26 Q38 28 41 26" stroke="#1F2937" strokeWidth="2" fill="none"/>
      {/* Peaceful smile */}
      <path d="M28 34 Q32 36 36 34" stroke="#8B5A3C" strokeWidth="1.5" fill="none"/>
      {/* Relaxed eyebrows */}
      <path d="M22 22 Q26 21 29 22" stroke="#4A3728" strokeWidth="1.5" fill="none"/>
      <path d="M35 22 Q38 21 42 22" stroke="#4A3728" strokeWidth="1.5" fill="none"/>
      {/* Flowing hair */}
      <path d="M16 24 Q18 10 32 10 Q46 10 48 24" fill="#4A3728"/>
      <path d="M18 22 Q14 28 10 32" stroke="#4A3728" strokeWidth="3" fill="none"/>
      <path d="M46 22 Q50 28 54 32" stroke="#4A3728" strokeWidth="3" fill="none"/>
      {/* Floating clouds/dreams */}
      <ellipse cx="10" cy="16" rx="6" ry="3" fill="white" opacity="0.6"/>
      <ellipse cx="54" cy="12" rx="5" ry="2.5" fill="white" opacity="0.6"/>
      <ellipse cx="50" cy="50" rx="4" ry="2" fill="white" opacity="0.4"/>
    </svg>
  )
}

// SVG caricature for The Risk Controller - protective, shield-like
function RiskControllerAvatar() {
  return (
    <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="32" cy="32" r="30" fill="#059669"/>
      <circle cx="32" cy="28" r="16" fill="#FFD7BA"/>
      <ellipse cx="32" cy="42" rx="14" ry="10" fill="#10B981"/>
      {/* Focused determined eyes */}
      <ellipse cx="26" cy="26" rx="2.5" ry="3" fill="#1F2937"/>
      <ellipse cx="38" cy="26" rx="2.5" ry="3" fill="#1F2937"/>
      {/* Slight confident smile */}
      <path d="M28 34 Q32 36 36 34" stroke="#8B5A3C" strokeWidth="1.5" fill="none"/>
      {/* Determined eyebrows */}
      <path d="M22 22 L28 24" stroke="#4A3728" strokeWidth="2"/>
      <path d="M36 24 L42 22" stroke="#4A3728" strokeWidth="2"/>
      {/* Neat hair */}
      <path d="M18 20 Q22 12 32 12 Q42 12 46 20" fill="#2D2D2D"/>
      {/* Shield symbol */}
      <path d="M8 44 L8 52 Q8 58 14 58 L14 44 Q11 42 8 44" fill="#22C55E"/>
      <path d="M11 48 L11 52" stroke="white" strokeWidth="2"/>
      <path d="M9 50 L13 50" stroke="white" strokeWidth="2"/>
      {/* Lock icon */}
      <rect x="48" y="48" width="8" height="6" rx="1" fill="#22C55E"/>
      <path d="M50 48 L50 46 Q52 44 54 46 L54 48" stroke="#22C55E" strokeWidth="2" fill="none"/>
    </svg>
  )
}

// SVG caricature for The Big Spender - confident, flashy
function BigSpenderAvatar() {
  return (
    <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="32" cy="32" r="30" fill="#B45309"/>
      <circle cx="32" cy="28" r="16" fill="#FFD7BA"/>
      <ellipse cx="32" cy="42" rx="14" ry="10" fill="#D97706"/>
      {/* Confident eyes */}
      <circle cx="26" cy="26" r="2.5" fill="#1F2937"/>
      <circle cx="38" cy="26" r="2.5" fill="#1F2937"/>
      <circle cx="27" cy="25" r="1" fill="white"/>
      <circle cx="39" cy="25" r="1" fill="white"/>
      {/* Confident smirk */}
      <path d="M26 34 Q32 38 38 34" stroke="#8B5A3C" strokeWidth="2" fill="none"/>
      {/* Raised confident eyebrow */}
      <path d="M22 21 Q26 19 29 21" stroke="#4A3728" strokeWidth="2"/>
      <path d="M35 21 Q38 19 42 21" stroke="#4A3728" strokeWidth="2"/>
      {/* Slicked back hair */}
      <path d="M18 20 Q24 10 32 10 Q40 10 46 20" fill="#1F1F1F"/>
      {/* Dollar signs */}
      <circle cx="10" cy="20" r="6" fill="#FBBF24"/>
      <text x="10" y="23" textAnchor="middle" fill="#92400E" fontSize="8" fontWeight="bold">$</text>
      <circle cx="54" cy="18" r="5" fill="#FBBF24"/>
      <text x="54" y="21" textAnchor="middle" fill="#92400E" fontSize="7" fontWeight="bold">$</text>
      {/* Casino chip */}
      <circle cx="52" cy="50" r="6" fill="#EF4444"/>
      <circle cx="52" cy="50" r="4" fill="none" stroke="white" strokeWidth="1"/>
    </svg>
  )
}

// SVG caricature for The Superfan - jersey, team spirit
function SuperfanAvatar() {
  return (
    <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="32" cy="32" r="30" fill="#7C2D12"/>
      <circle cx="32" cy="28" r="16" fill="#FFD7BA"/>
      {/* Jersey */}
      <ellipse cx="32" cy="44" rx="16" ry="12" fill="#DC2626"/>
      <text x="32" y="48" textAnchor="middle" fill="white" fontSize="10" fontWeight="bold">#1</text>
      {/* Enthusiastic eyes */}
      <circle cx="26" cy="26" r="3" fill="#1F2937"/>
      <circle cx="38" cy="26" r="3" fill="#1F2937"/>
      <circle cx="27" cy="25" r="1.5" fill="white"/>
      <circle cx="39" cy="25" r="1.5" fill="white"/>
      {/* Cheering open mouth */}
      <ellipse cx="32" cy="36" rx="4" ry="3" fill="#8B5A3C"/>
      <path d="M28 35 Q32 33 36 35" fill="white"/>
      {/* Team cap */}
      <path d="M18 20 Q20 14 32 14 Q44 14 46 20" fill="#1E40AF"/>
      <rect x="18" y="18" width="28" height="4" fill="#1E40AF"/>
      <rect x="28" y="14" width="8" height="4" fill="#1E40AF"/>
      {/* Foam finger */}
      <path d="M8 38 L6 28 L14 26 L14 36 L10 40 Z" fill="#FBBF24"/>
      <path d="M10 30 L10 24" stroke="#FBBF24" strokeWidth="4"/>
    </svg>
  )
}

// SVG caricature for The Aspiring Pro - professional, suit
function AspiringProAvatar() {
  return (
    <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="32" cy="32" r="30" fill="#1F2937"/>
      <circle cx="32" cy="26" r="14" fill="#FFD7BA"/>
      {/* Professional suit */}
      <path d="M16 44 L22 36 L32 40 L42 36 L48 44 L48 58 L16 58 Z" fill="#374151"/>
      {/* Tie */}
      <path d="M30 40 L32 42 L34 40 L33 54 L31 54 Z" fill="#3B82F6"/>
      {/* Shirt collar */}
      <path d="M26 38 L32 42 L38 38" stroke="white" strokeWidth="2" fill="none"/>
      {/* Focused professional eyes */}
      <ellipse cx="28" cy="24" rx="2" ry="2.5" fill="#1F2937"/>
      <ellipse cx="36" cy="24" rx="2" ry="2.5" fill="#1F2937"/>
      {/* Slight professional smile */}
      <path d="M28 32 Q32 34 36 32" stroke="#8B5A3C" strokeWidth="1.5" fill="none"/>
      {/* Professional brows */}
      <path d="M24 20 L30 21" stroke="#4A3728" strokeWidth="1.5"/>
      <path d="M34 21 L40 20" stroke="#4A3728" strokeWidth="1.5"/>
      {/* Neat professional hair */}
      <path d="M20 18 Q24 12 32 12 Q40 12 44 18" fill="#1A1A1A"/>
      {/* Chart going up */}
      <path d="M50 52 L52 48 L54 50 L56 44 L58 46" stroke="#10B981" strokeWidth="2" fill="none"/>
    </svg>
  )
}

// SVG caricature for The Casual Dabbler - relaxed, casual
function CasualDabblerAvatar() {
  return (
    <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="32" cy="32" r="30" fill="#64748B"/>
      <circle cx="32" cy="28" r="16" fill="#FFD7BA"/>
      {/* Casual t-shirt */}
      <ellipse cx="32" cy="44" rx="14" ry="12" fill="#94A3B8"/>
      {/* Relaxed content eyes */}
      <path d="M23 26 Q26 24 29 26" stroke="#1F2937" strokeWidth="2" fill="none"/>
      <path d="M35 26 Q38 24 41 26" stroke="#1F2937" strokeWidth="2" fill="none"/>
      {/* Easy-going smile */}
      <path d="M28 34 Q32 36 36 34" stroke="#8B5A3C" strokeWidth="1.5" fill="none"/>
      {/* Relaxed eyebrows */}
      <path d="M23 22 Q26 22 29 23" stroke="#4A3728" strokeWidth="1.5" fill="none"/>
      <path d="M35 23 Q38 22 41 22" stroke="#4A3728" strokeWidth="1.5" fill="none"/>
      {/* Casual messy hair */}
      <path d="M18 20 Q20 12 28 12 Q32 10 36 12 Q44 12 46 20" fill="#8B7355"/>
      <path d="M24 14 Q26 10 28 14" fill="#8B7355"/>
      <path d="M36 14 Q38 10 40 14" fill="#8B7355"/>
      {/* Shrug hands emoji style */}
      <text x="10" y="54" fontSize="12">🤷</text>
    </svg>
  )
}

// Default avatar when no archetype is set
function DefaultAvatar() {
  return (
    <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="32" cy="32" r="30" fill="#6B7280"/>
      <circle cx="32" cy="26" r="14" fill="#FFD7BA"/>
      <ellipse cx="32" cy="44" rx="14" ry="12" fill="#9CA3AF"/>
      <circle cx="26" cy="24" r="2" fill="#1F2937"/>
      <circle cx="38" cy="24" r="2" fill="#1F2937"/>
      <path d="M28 32 Q32 34 36 32" stroke="#8B5A3C" strokeWidth="1.5" fill="none"/>
      <path d="M20 18 Q24 12 32 12 Q40 12 44 18" fill="#6B4423"/>
      <text x="32" y="52" textAnchor="middle" fill="white" fontSize="8">?</text>
    </svg>
  )
}

const avatarComponents: Record<string, React.FC> = {
  analyst: AnalystAvatar,
  emotional_bettor: EmotionalBettorAvatar,
  thrill_seeker: ThrillSeekerAvatar,
  social_bettor: SocialBettorAvatar,
  escape_artist: EscapeArtistAvatar,
  risk_controller: RiskControllerAvatar,
  big_spender: BigSpenderAvatar,
  superfan: SuperfanAvatar,
  aspiring_pro: AspiringProAvatar,
  casual_dabbler: CasualDabblerAvatar,
  default: DefaultAvatar,
}

export function ArchetypeAvatar({ archetype, size = "md", className }: ArchetypeAvatarProps) {
  const archetypeId = getArchetypeId(archetype)
  const AvatarComponent = avatarComponents[archetypeId] || DefaultAvatar

  return (
    <div
      className={cn(
        "rounded-full overflow-hidden flex items-center justify-center",
        sizeClasses[size],
        className
      )}
      title={archetype || "Take the survey to discover your archetype"}
    >
      <AvatarComponent />
    </div>
  )
}
