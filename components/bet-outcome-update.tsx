import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { CheckCircle2, XCircle, MinusCircle, Clock } from "lucide-react"
import type { ComprehensiveBet } from "@/lib/types/bet-tracking"
import { BetTrackingService } from "@/lib/bet-tracking-service"

interface BetOutcomeUpdateProps {
  bet: ComprehensiveBet
  onUpdate: (updatedBet: ComprehensiveBet) => void
  onCancel: () => void
}

export function BetOutcomeUpdate({ bet, onUpdate, onCancel }: BetOutcomeUpdateProps) {
  const [outcome, setOutcome] = useState<"win" | "loss" | "push" | "pending">(bet.outcome || "pending")
  const [postBetEmotion, setPostBetEmotion] = useState(bet.emotions.after?.emotion || "")
  const [postBetIntensity, setPostBetIntensity] = useState(bet.emotions.after?.intensity || 5)
  const [reflection, setReflection] = useState(bet.emotions.after?.reflection || "")
  const [updating, setUpdating] = useState(false)

  const handleUpdate = async () => {
    setUpdating(true)
    try {
      const updatedBet = await BetTrackingService.updateBetOutcome(
        bet.id,
        outcome as "win" | "loss" | "push" | "pending",
        postBetEmotion || undefined,
        postBetIntensity || undefined,
        reflection || undefined
      )
      
      if (updatedBet) {
        onUpdate(updatedBet)
        toast.success("Bet outcome updated successfully!")
      } else {
        toast.error("Failed to update bet outcome")
      }
    } catch (error) {
      console.error("Error updating bet outcome:", error)
      toast.error("Failed to update bet outcome")
    } finally {
      setUpdating(false)
    }
  }

  const calculateReturn = () => {
    if (outcome === "pending") return 0
    if (outcome === "push") return bet.stake
    
    // Calculate return for win/loss
    if (bet.odds > 0) {
      return outcome === "win" ? bet.stake + (bet.stake * bet.odds / 100) : 0
    } else {
      return outcome === "win" ? bet.stake + (bet.stake * 100 / Math.abs(bet.odds)) : 0
    }
  }

  const calculateP_L = () => {
    if (outcome === "pending") return 0
    return calculateReturn() - bet.stake
  }

  const returnAmount = calculateReturn()
  const profitLoss = calculateP_L()

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Update Bet Outcome
          <Badge variant={outcome === "pending" ? "secondary" : outcome === "win" ? "default" : outcome === "loss" ? "destructive" : "outline"}>
            {outcome === "pending" && <Clock className="h-3 w-3" />}
            {outcome === "win" && <CheckCircle2 className="h-3 w-3" />}
            {outcome === "loss" && <XCircle className="h-3 w-3" />}
            {outcome === "push" && <MinusCircle className="h-3 w-3" />}
            {outcome.charAt(0).toUpperCase() + outcome.slice(1)}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Bet Details Summary */}
        <div className="bg-muted/30 p-4 rounded-lg space-y-2">
          <div className="flex justify-between">
            <span className="text-sm font-medium">Game:</span>
            <span className="text-sm">{bet.awayTeam} @ {bet.homeTeam}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm font-medium">Bet Type:</span>
            <span className="text-sm capitalize">{bet.betType} - {bet.selection}</span>
          </div>
          {bet.line && (
            <div className="flex justify-between">
              <span className="text-sm font-medium">Line:</span>
              <span className="text-sm">{bet.line}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-sm font-medium">Odds:</span>
            <span className="text-sm">{bet.odds > 0 ? `+${bet.odds}` : bet.odds}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm font-medium">Stake:</span>
            <span className="text-sm">${bet.stake.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm font-medium">Pre-bet Emotion:</span>
            <span className="text-sm">{bet.emotions.before.emotion} ({bet.emotions.before.intensity}/10)</span>
          </div>
        </div>

        {/* Outcome Selection */}
        <div className="space-y-2">
          <Label htmlFor="outcome">Bet Outcome</Label>
          <Select value={outcome} onValueChange={(value: any) => setOutcome(value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="win">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  Win
                </div>
              </SelectItem>
              <SelectItem value="loss">
                <div className="flex items-center gap-2">
                  <XCircle className="h-4 w-4 text-red-500" />
                  Loss
                </div>
              </SelectItem>
              <SelectItem value="push">
                <div className="flex items-center gap-2">
                  <MinusCircle className="h-4 w-4 text-yellow-500" />
                  Push
                </div>
              </SelectItem>
              <SelectItem value="pending">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-gray-500" />
                  Pending
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* P/L Calculation */}
        {outcome !== "pending" && (
          <div className="bg-muted/30 p-4 rounded-lg space-y-2">
            <div className="flex justify-between">
              <span className="text-sm font-medium">Return:</span>
              <span className={`text-sm font-bold ${returnAmount >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                ${returnAmount.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm font-medium">P/L:</span>
              <span className={`text-sm font-bold ${profitLoss >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {profitLoss >= 0 ? '+' : ''}${profitLoss.toFixed(2)}
              </span>
            </div>
          </div>
        )}

        {/* Post-bet Emotion */}
        <div className="space-y-4">
          <Label>Post-bet Emotion (Optional)</Label>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="postEmotion" className="text-sm">Emotion</Label>
              <Input
                id="postEmotion"
                value={postBetEmotion}
                onChange={(e) => setPostBetEmotion(e.target.value)}
                placeholder="e.g., Relieved, Disappointed, Excited"
              />
            </div>
            <div>
              <Label htmlFor="postIntensity" className="text-sm">Intensity (1-10)</Label>
              <Input
                id="postIntensity"
                type="number"
                min="1"
                max="10"
                value={postBetIntensity}
                onChange={(e) => setPostBetIntensity(parseInt(e.target.value) || 5)}
              />
            </div>
          </div>
          <div>
            <Label htmlFor="reflection" className="text-sm">Reflection (Optional)</Label>
            <Textarea
              id="reflection"
              value={reflection}
              onChange={(e) => setReflection(e.target.value)}
              placeholder="How do you feel about the outcome? What did you learn?"
              rows={3}
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-4">
          <Button
            variant="outline"
            onClick={onCancel}
            className="flex-1"
            disabled={updating}
          >
            Cancel
          </Button>
          <Button
            onClick={handleUpdate}
            className="flex-1"
            disabled={updating || outcome === "pending"}
          >
            {updating ? "Updating..." : "Update Outcome"}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
