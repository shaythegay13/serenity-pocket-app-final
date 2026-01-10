import React from "react"
import { ArrowRight, BarChart3 } from "lucide-react"

/**
 * TiltLabBanner Component
 *
 * Horizontal promotional banner for TiltLab bet analysis tool.
 * Appears below the feature cards grid on sport dashboard tabs.
 *
 * Design matches the v0 screenshot with:
 * - Icon on the left (chart icon in blue/purple rounded square)
 * - Title "TiltLab"
 * - Description text
 * - "Analyze a Bet" button with arrow
 */
export function TiltLabBanner() {
  const handleClick = () => {
    console.log('TiltLab banner clicked - navigating to AI Picks')
    // Navigate to AI Picks tab where TiltLab is located
    window.location.href = "/?tab=ai-picks"
  }

  return (
    <div
      className="mt-6 bg-gradient-to-r from-[#1a1f2e] to-[#151923] border border-white/10 rounded-xl p-6 cursor-pointer hover:border-[#00FF41]/30 hover:shadow-[0_0_20px_rgba(0,255,65,0.15)] transition-all duration-300"
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault()
          handleClick()
        }
      }}
      aria-label="Navigate to TiltLab bet analyzer"
    >
      <div className="flex items-center justify-between gap-6">
        {/* Left side - Icon + Text */}
        <div className="flex items-center gap-4">
          {/* Icon */}
          <div className="flex items-center justify-center w-16 h-16 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-blue-500/30 flex-shrink-0">
            <BarChart3 className="h-8 w-8 text-blue-400" aria-hidden="true" />
          </div>

          {/* Text Content */}
          <div>
            <h3 className="text-xl font-bold text-white mb-1">
              TiltLab
            </h3>
            <p className="text-sm text-gray-400 leading-relaxed max-w-2xl">
              Get instant analysis on any bet with our AI engine. Enter your bet details and receive comprehensive insights including line movement, value assessment, and risk scoring.
            </p>
          </div>
        </div>

        {/* Right side - Button */}
        <div className="flex-shrink-0 hidden md:block">
          <button
            className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-semibold rounded-lg transition-all duration-200 flex items-center gap-2 shadow-lg hover:shadow-xl transform hover:scale-105"
            aria-label="Analyze a bet with TiltLab"
          >
            Analyze a Bet
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  )
}

TiltLabBanner.displayName = "TiltLabBanner"
