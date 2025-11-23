"use client"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface Deal {
  book: string
  title: string
  details: string
  type?: string
}

const DEALS: Deal[] = [
  { book: "DraftKings", title: "No Sweat SGP (Mon)", details: "Same-Game Parlay insurance on select games. Opt-in required." },
  { book: "DraftKings", title: "Profit Boosts", details: "Daily boosts across NBA/NFL/MLB; eligibility varies by state." },
  { book: "FanDuel", title: "Bonus Bets Back", details: "Get a bonus bet back when your same-game parlay loses by one leg." },
  { book: "FanDuel", title: "Daily Props Boost", details: "Enhanced prices on popular player props." },
  { book: "BetMGM", title: "Parlay Plus", details: "Up to 40% profit boost on eligible parlays." },
  { book: "BetMGM", title: "First Bet Offer", details: "Bonus bets back if your first bet loses (new users)." },
  { book: "Caesars", title: "Odds Boosts", details: "Daily boosts across markets; check promos tab." },
  { book: "Caesars", title: "Parlay Insurance", details: "Select parlay insurance offers, opt-in required." },
]

export function SportsbookDeals() {
  return (
    <Card className="p-4">
      <h4 className="text-sm font-semibold text-foreground mb-3">Sportsbook Specials</h4>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {DEALS.map((d, i) => (
          <Card key={i} className="p-3">
            <div className="flex items-center justify-between mb-1">
              <p className="text-sm font-medium text-foreground">{d.title}</p>
              <Badge variant="outline" className="text-xs">{d.book}</Badge>
            </div>
            <p className="text-xs text-muted-foreground">{d.details}</p>
          </Card>
        ))}
      </div>
      <p className="text-[11px] text-muted-foreground mt-3">Promotions vary by state and user eligibility. Always review terms in the sportsbook app.</p>
    </Card>
  )
}
