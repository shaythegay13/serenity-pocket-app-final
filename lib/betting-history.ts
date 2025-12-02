import type { GameLineRecord, GameMarketSnapshot, SupportedSportKey } from "./types"

function isFinal(record: GameLineRecord): boolean {
  return record.finalStatus === "final" &&
    typeof record.homeScore === "number" &&
    typeof record.awayScore === "number"
}

function getTeamRole(record: GameLineRecord, team: string): "home" | "away" | null {
  const name = team.toLowerCase()
  if (record.homeTeam.toLowerCase() === name) return "home"
  if (record.awayTeam.toLowerCase() === name) return "away"
  return null
}

function getMarkets(record: GameLineRecord, type: "total" | "spread"): GameMarketSnapshot[] {
  return (record.markets || []).filter(m => m.marketType === type)
}

export interface OverUnderRecord {
  over: number
  under: number
  push: number
}

export interface ATSRecord {
  covers: number
  fails: number
  pushes: number
}

export function computeTeamOverUnderRecord(
  teamName: string,
  sport: SupportedSportKey,
  history: GameLineRecord[],
): OverUnderRecord {
  const teamLower = teamName.toLowerCase()
  let over = 0
  let under = 0
  let push = 0

  for (const record of history) {
    if (record.sport !== sport) continue
    if (!isFinal(record)) continue

    const role = getTeamRole(record, teamLower)
    if (!role) continue

    const totals = getMarkets(record, "total")
    if (!totals.length) continue

    const totalMarket = totals[0]
    if (typeof totalMarket.line !== "number") continue

    const totalScore = (record.homeScore || 0) + (record.awayScore || 0)
    const line = totalMarket.line

    if (totalScore > line) over++
    else if (totalScore < line) under++
    else push++
  }

  return { over, under, push }
}

export function computeTeamATSRecord(
  teamName: string,
  sport: SupportedSportKey,
  history: GameLineRecord[],
): ATSRecord {
  const teamLower = teamName.toLowerCase()
  let covers = 0
  let fails = 0
  let pushes = 0

  for (const record of history) {
    if (record.sport !== sport) continue
    if (!isFinal(record)) continue

    const role = getTeamRole(record, teamLower)
    if (!role) continue

    const spreads = getMarkets(record, "spread")
    if (!spreads.length) continue

    const spreadMarket = spreads[0]
    if (typeof spreadMarket.line !== "number") continue

    const margin = (record.homeScore || 0) - (record.awayScore || 0)
    const spread = spreadMarket.line

    let adjustedMargin: number
    if (role === "home") {
      adjustedMargin = margin - spread
    } else {
      adjustedMargin = -margin - spread
    }

    if (adjustedMargin > 0) covers++
    else if (adjustedMargin < 0) fails++
    else pushes++
  }

  return { covers, fails, pushes }
}

export function formatOverUnderRecord(r: OverUnderRecord): string {
  const total = r.over + r.under + r.push
  if (total === 0) return "No O/U data yet"
  return `${r.over}-${r.under}${r.push ? `-${r.push}` : ""} O/U`
}

export function formatATSRecord(r: ATSRecord): string {
  const total = r.covers + r.fails + r.pushes
  if (total === 0) return "No ATS data yet"
  const pct = total > 0 ? (r.covers / total) * 100 : 0
  return `${r.covers}-${r.fails}${r.pushes ? `-${r.pushes}` : ""} ATS (${pct.toFixed(1)}% cover)`
}
