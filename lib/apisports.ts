// Stub module to satisfy imports after removing the previous external stats provider.
// These exports are intentionally non-functional.

import type { SupportedSportKey } from "./types"

export async function resolveLeagueAndSeason(_sport: SupportedSportKey): Promise<{ leagueId?: number; season?: number }> {
  return {}
}

export async function fetchApiSportsTeams(_sport: SupportedSportKey, _params: { league?: string | number; season?: string | number } = {}) {
  return { response: [] }
}

export async function fetchApiSportsPlayerStatistics(
  _sport: SupportedSportKey,
  _params: { id?: string | number; team?: string | number; season: string | number },
) {
  return { response: [] }
}

export async function fetchApiSportsInjuries(
  _sport: SupportedSportKey,
  _params: { league?: string | number; season?: string | number; team?: string | number },
) {
  return { response: [] }
}

export function getApiSportsLeagueAndSeason(_sport: SupportedSportKey): { league?: string; season?: string } {
  return {}
}
