// Minimal sportsFetcher for backward compatibility
// This is used by espn-api.ts for team roster data

export const sportsFetcher = {
  getTeamRoster: async (sportKey, teamAbbr) => {
    // Return empty data for now - this maintains API compatibility
    console.log(`sportsFetcher.getTeamRoster called for ${sportKey}/${teamAbbr}`)
    return { data: [] }
  }
}
