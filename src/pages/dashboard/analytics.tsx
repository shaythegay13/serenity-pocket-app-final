"use client"

import { useState } from "react"
import { Navigation } from "@/components/navigation"
import { TeamModal } from "@/components/team-modal"
import { PlayerModal } from "@/components/player-modal"

const teams = [
  { id: 1, name: "Arizona Cardinals", abbr: "ARI" },
  { id: 2, name: "Atlanta Falcons", abbr: "ATL" },
  { id: 3, name: "Baltimore Ravens", abbr: "BAL" },
  { id: 4, name: "Buffalo Bills", abbr: "BUF" },
  { id: 5, name: "Carolina Panthers", abbr: "CAR" },
  { id: 6, name: "Chicago Bears", abbr: "CHI" },
  { id: 7, name: "Cincinnati Bengals", abbr: "CIN" },
  { id: 8, name: "Cleveland Browns", abbr: "CLE" },
  { id: 9, name: "Green Bay Packers", abbr: "GB" },
  { id: 10, name: "Houston Texans", abbr: "HOU" },
  { id: 11, name: "Indianapolis Colts", abbr: "IND" },
  { id: 12, name: "Jacksonville Jaguars", abbr: "JAX" },
  { id: 13, name: "Las Vegas Raiders", abbr: "LV" },
  { id: 14, name: "Los Angeles Chargers", abbr: "LAC" },
  { id: 15, name: "Los Angeles Rams", abbr: "LAR" },
  { id: 16, name: "Miami Dolphins", abbr: "MIA" },
  { id: 17, name: "New England Patriots", abbr: "NE" },
  { id: 18, name: "Seattle Seahawks", abbr: "SEA" },
]

export default function AnalyticsPage() {
  const [selectedTeam, setSelectedTeam] = useState<any>(null)
  const [selectedPlayer, setSelectedPlayer] = useState<any>(null)

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Team & Player Analytics</h1>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
          {teams.map((team) => (
            <button
              key={team.id}
              onClick={() =>
                setSelectedTeam({
                  name: team.name,
                  record: "12-1",
                  recentForm: ["W", "W", "W", "W", "W"],
                  pointsPerGame: "26.6",
                  pointsAllowed: "23.4",
                  totalYards: "344",
                  turnovers: "11",
                })
              }
              className="group flex flex-col items-center gap-3 rounded-xl border border-border/50 bg-card/50 p-4 backdrop-blur-sm transition-all hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5"
            >
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 transition-all group-hover:scale-110">
                <span className="text-xl font-bold text-foreground">{team.abbr}</span>
              </div>
              <div className="text-center">
                <div className="text-sm font-medium text-foreground">{team.name}</div>
              </div>
            </button>
          ))}
        </div>

        <div className="mt-12">
          <h2 className="mb-4 text-2xl font-bold text-foreground">Featured Players</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <button
              onClick={() =>
                setSelectedPlayer({
                  name: "Miles Battle",
                  position: "CB",
                  team: "New England Patriots",
                  number: "35",
                })
              }
              className="group flex items-center gap-4 rounded-xl border border-border/50 bg-card/50 p-4 backdrop-blur-sm transition-all hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5"
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-secondary/20 ring-2 ring-secondary/20">
                <span className="text-xl font-bold text-secondary">35</span>
              </div>
              <div className="flex-1 text-left">
                <div className="font-semibold text-foreground">Miles Battle</div>
                <div className="text-sm text-muted-foreground">CB • #35 • New England Patriots</div>
              </div>
            </button>
          </div>
        </div>
      </main>

      {selectedTeam && <TeamModal team={selectedTeam} onClose={() => setSelectedTeam(null)} />}
      {selectedPlayer && <PlayerModal player={selectedPlayer} onClose={() => setSelectedPlayer(null)} />}
    </div>
  )
}
