"use client"

import { Badge } from "@/components/ui/badge"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { PreTradeForm } from "@/components/pre-trade-form"
import { PostTradeForm } from "@/components/post-trade-form"
import { TradeHistory } from "@/components/trade-history"
import { storageHybrid as storage } from "@/lib/storage-hybrid"
import type { UserData, Trade } from "@/lib/types"
import { Plus, History, FileText } from "lucide-react"
import { format } from "date-fns"

interface JournalTabProps {
  userData: UserData
  updateUserData: (updates: Partial<UserData>) => Promise<void>
}

export function JournalTab({ userData, updateUserData }: JournalTabProps) {
  const [view, setView] = useState<"history" | "pre-trade" | "post-trade" | "detail">("history")
  const [trades, setTrades] = useState<Trade[]>([])
  const [selectedTrade, setSelectedTrade] = useState<Trade | null>(null)

  useEffect(() => {
    const loadTrades = async () => {
      const tradesData = await storage.getTrades()
      setTrades(tradesData)
    }
    loadTrades()
  }, [])

  const handlePreTradeComplete = async (trade: Trade) => {
    const tradesData = await storage.getTrades()
    setTrades(tradesData)
    const biasCount = trade.biasesIdentified.length
    const newBiasRingProgress = Math.min(userData.dailyRings.biasRecognition + (biasCount * 15), 100)
    
    updateUserData({
      xp: userData.xp + 15,
      totalTrades: userData.totalTrades + 1,
      totalBiasesIdentified: userData.totalBiasesIdentified + biasCount,
      dailyRings: {
        ...userData.dailyRings,
        biasRecognition: newBiasRingProgress,
      },
    })
    setView("history")
  }

  const handlePostTradeComplete = async () => {
    const tradesData = await storage.getTrades()
    setTrades(tradesData)
    const mindfulTrade = selectedTrade && selectedTrade.biasesIdentified.length > 0
    const newMindfulnessProgress = Math.min(userData.dailyRings.mindfulness + 20, 100)
    
    updateUserData({
      xp: userData.xp + 20,
      mindfulTrades: mindfulTrade ? userData.mindfulTrades + 1 : userData.mindfulTrades,
      mindfulDecisionPercentage: Math.round(
        ((mindfulTrade ? userData.mindfulTrades + 1 : userData.mindfulTrades) / (userData.totalTrades + 1)) * 100,
      ),
      dailyRings: {
        ...userData.dailyRings,
        mindfulness: newMindfulnessProgress,
      },
    })
    setView("detail")
  }

  const handleSelectTrade = (trade: Trade) => {
    setSelectedTrade(trade)
    setView("detail")
  }

  return (
    <div className="space-y-6 fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-foreground">Decision Journal</h2>
          <p className="text-muted-foreground">Track your trading decisions and learn from outcomes</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={view === "history" ? "default" : "outline"}
            onClick={() => setView("history")}
            className="gap-2"
          >
            <History className="h-4 w-4" />
            History
          </Button>
          <Button
            variant={view === "pre-trade" ? "default" : "outline"}
            onClick={() => setView("pre-trade")}
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            New Trade
          </Button>
        </div>
      </div>

      {/* History View */}
      {view === "history" && (
        <div className="space-y-6">
          {/* Pending Trades Section */}
          {trades.filter(t => !t.outcome).length > 0 && (
            <Card className="p-6 bg-gradient-to-br from-amber/10 to-orange/10 border-amber/30">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-amber/20">
                    <FileText className="h-5 w-5 text-amber" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">Pending Trade Reflections</h3>
                    <p className="text-xs text-muted-foreground">
                      Complete these entries to earn XP and track your trading outcomes
                    </p>
                  </div>
                </div>
                <Badge variant="outline" className="bg-amber/10">
                  {trades.filter(t => !t.outcome).length} pending
                </Badge>
              </div>
              <div className="space-y-2">
                {trades.filter(t => !t.outcome).slice(0, 3).map((trade) => (
                  <div key={trade.id} className="flex items-center justify-between p-3 rounded-lg bg-card border border-border">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">{trade.preTradeEmotion}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(trade.timestamp), "MMM d, yyyy")}
                      </p>
                    </div>
                    <Button 
                      size="sm" 
                      onClick={() => {
                        setSelectedTrade(trade)
                        setView("post-trade")
                      }}
                    >
                      Complete (+20 XP)
                    </Button>
                  </div>
                ))}
              </div>
            </Card>
          )}

          <Card className="p-6 bg-gradient-to-br from-primary/5 to-blue/5 border-primary/30">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-primary/20">
                <FileText className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-foreground">Why Keep a Trading Journal?</h3>
                <p className="text-sm text-muted-foreground">
                  Document emotions and biases before trades, then reflect afterward to identify patterns and improve
                  decision-making.
                </p>
              </div>
            </div>
          </Card>

          <div>
            <h3 className="text-xl font-semibold text-foreground mb-4">Your Trades</h3>
            <TradeHistory 
              trades={trades} 
              onSelectTrade={handleSelectTrade}
              onCompletePostTrade={(trade) => {
                setSelectedTrade(trade)
                setView("post-trade")
              }}
            />
          </div>
        </div>
      )}

      {/* Pre-Trade View */}
      {view === "pre-trade" && (
        <div>
          <Card className="p-6 bg-primary/5 border border-primary/20 mb-6">
            <h3 className="text-lg font-semibold text-foreground mb-2">Pre-Trade Entry</h3>
            <p className="text-sm text-muted-foreground">
              Before entering a trade, document your emotional state, identify potential biases, and record your
              reasoning. This helps you make more mindful decisions.
            </p>
          </Card>
          <PreTradeForm onComplete={handlePreTradeComplete} />
        </div>
      )}

      {/* Post-Trade View */}
      {view === "post-trade" && selectedTrade && (
        <div>
          <Card className="p-6 bg-primary/5 border border-primary/20 mb-6">
            <h3 className="text-lg font-semibold text-foreground mb-2">Post-Trade Entry</h3>
            <p className="text-sm text-muted-foreground">
              After closing a trade, reflect on the outcome, your emotions, and what you learned. This builds
              self-awareness and improves future decisions.
            </p>
          </Card>
          <PostTradeForm trade={selectedTrade} onComplete={handlePostTradeComplete} />
        </div>
      )}

      {/* Detail View */}
      {view === "detail" && selectedTrade && (
        <div className="space-y-6">
          <Button variant="outline" onClick={() => setView("history")} className="gap-2">
            ← Back to History
          </Button>

          <Card className="p-6">
            <div className="space-y-6">
              <div>
                <h3 className="text-2xl font-bold text-foreground mb-2">Trade Details</h3>
                <p className="text-sm text-muted-foreground">
                  {format(new Date(selectedTrade.timestamp), "MMMM d, yyyy 'at' h:mm a")}
                </p>
              </div>

              {/* Pre-Trade Section */}
              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-foreground">Pre-Trade Analysis</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                    <p className="text-sm text-muted-foreground mb-1">Emotion</p>
                    <p className="font-semibold text-foreground">{selectedTrade.preTradeEmotion}</p>
                    <p className="text-xs text-muted-foreground">Intensity: {selectedTrade.preTradeIntensity}/5</p>
                  </div>
                  <div className="p-4 rounded-lg bg-blue/5 border border-blue/20">
                    <p className="text-sm text-muted-foreground mb-1">Confidence</p>
                    <p className="font-semibold text-foreground">{selectedTrade.confidenceLevel}/10</p>
                  </div>
                </div>
                {selectedTrade.biasesIdentified.length > 0 && (
                  <div className="p-4 rounded-lg bg-accent/10 border border-accent/30">
                    <p className="text-sm text-muted-foreground mb-2">Identified Biases</p>
                    <div className="flex gap-2 flex-wrap">
                      {selectedTrade.biasesIdentified.map((bias) => (
                        <Badge key={bias} variant="outline">
                          {bias}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                  <p className="text-sm text-muted-foreground mb-2">Reasoning</p>
                  <p className="text-sm text-foreground whitespace-pre-wrap">{selectedTrade.reasoning}</p>
                </div>
              </div>

              {/* Post-Trade Section */}
              {selectedTrade.outcome ? (
                <div className="space-y-4">
                  <h4 className="text-lg font-semibold text-foreground">Post-Trade Reflection</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                      <p className="text-sm text-muted-foreground mb-1">Outcome</p>
                      <p className="font-semibold text-foreground capitalize">{selectedTrade.outcome}</p>
                    </div>
                    <div className="p-4 rounded-lg bg-blue/5 border border-blue/20">
                      <p className="text-sm text-muted-foreground mb-1">Post-Trade Emotion</p>
                      <p className="font-semibold text-foreground">{selectedTrade.postTradeEmotion}</p>
                      <p className="text-xs text-muted-foreground">Intensity: {selectedTrade.postTradeIntensity}/5</p>
                    </div>
                  </div>
                  <div className="p-4 rounded-lg bg-accent/10 border border-accent/30">
                    <p className="text-sm text-muted-foreground mb-1">Emotional Impact</p>
                    <p className="font-semibold text-foreground">{selectedTrade.emotionalImpact}/10</p>
                  </div>
                  <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                    <p className="text-sm text-muted-foreground mb-2">Reflection</p>
                    <p className="text-sm text-foreground whitespace-pre-wrap">{selectedTrade.reflection}</p>
                  </div>
                </div>
              ) : (
                <div className="p-6 rounded-lg bg-gradient-to-br from-primary/5 to-blue/5 border border-primary/30">
                  <p className="text-center text-muted-foreground mb-4">This trade hasn't been closed yet</p>
                  <Button onClick={() => setView("post-trade")} className="w-full" size="lg">
                    Complete Post-Trade Entry (+20 XP)
                  </Button>
                </div>
              )}
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
