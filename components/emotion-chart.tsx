"use client"

import { Card } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts"
import type { EmotionLog } from "@/lib/types"

interface EmotionChartProps {
  logs: EmotionLog[]
}

// All 60 emotions mapped to their 6 core categories
const emotionCategories = {
  joy: {
    color: "#f59e0b",
    emotions: ["Happy", "Excited", "Optimistic", "Grateful", "Confident", "Proud", "Hopeful", "Content", "Cheerful", "Inspired"],
  },
  calm: {
    color: "#14b8a6",
    emotions: ["Peaceful", "Relaxed", "Centered", "Focused", "Balanced", "Serene", "Patient", "Composed", "Tranquil", "Stable"],
  },
  fear: {
    color: "#ef4444",
    emotions: ["Anxious", "Worried", "Nervous", "Scared", "Uncertain", "Panicked", "Hesitant", "Overwhelmed", "Tense", "Uneasy"],
  },
  greed: {
    color: "#8b5cf6",
    emotions: ["FOMO", "Euphoric", "Impulsive", "Overconfident", "Eager", "Craving", "Obsessed", "Compulsive", "Restless", "Driven"],
  },
  frustration: {
    color: "#f97316",
    emotions: ["Angry", "Irritated", "Disappointed", "Impatient", "Stressed", "Resentful", "Annoyed", "Agitated", "Bitter", "Exhausted"],
  },
  sadness: {
    color: "#6366f1",
    emotions: ["Down", "Discouraged", "Regretful", "Defeated", "Helpless", "Lonely", "Empty", "Hopeless", "Dejected", "Grief"],
  },
}

// Function to get the color for a specific emotion
function getEmotionColor(emotion: string): string {
  for (const [category, data] of Object.entries(emotionCategories)) {
    if (data.emotions.includes(emotion)) {
      return data.color
    }
  }
  return "hsl(var(--primary))" // Fallback color
}

function EmotionBarChart({ logs, phase }: { logs: EmotionLog[], phase: string }) {
  // Filter logs by phase
  const filteredLogs = phase === "all" ? logs : logs.filter(log => log.phase === phase)

  if (filteredLogs.length === 0) {
    return (
      <div className="flex items-center justify-center h-[300px]">
        <p className="text-center text-muted-foreground">No emotion data for this phase yet</p>
      </div>
    )
  }

  // Count emotions
  const emotionCounts: Record<string, number> = {}
  filteredLogs.forEach((log) => {
    emotionCounts[log.emotion] = (emotionCounts[log.emotion] || 0) + 1
  })

  const data = Object.entries(emotionCounts)
    .map(([emotion, count]) => ({
      emotion,
      count,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8)

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <XAxis dataKey="emotion" className="text-xs" />
        <YAxis />
        <Tooltip
          contentStyle={{
            backgroundColor: "hsl(var(--card))",
            border: "1px solid hsl(var(--border))",
            borderRadius: "8px",
          }}
        />
        <Bar dataKey="count" radius={[8, 8, 0, 0]}>
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={getEmotionColor(entry.emotion)} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}

export function EmotionChart({ logs }: EmotionChartProps) {
  if (logs.length === 0) {
    return (
      <Card className="p-6">
        <p className="text-center text-muted-foreground">Not enough data to display chart</p>
      </Card>
    )
  }

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold text-foreground mb-4">Most Common Emotions</h3>
      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-4 mb-4">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="before">Before Bet</TabsTrigger>
          <TabsTrigger value="during">During Bet</TabsTrigger>
          <TabsTrigger value="after">After Bet</TabsTrigger>
        </TabsList>
        <TabsContent value="all">
          <EmotionBarChart logs={logs} phase="all" />
        </TabsContent>
        <TabsContent value="before">
          <EmotionBarChart logs={logs} phase="before" />
        </TabsContent>
        <TabsContent value="during">
          <EmotionBarChart logs={logs} phase="during" />
        </TabsContent>
        <TabsContent value="after">
          <EmotionBarChart logs={logs} phase="after" />
        </TabsContent>
      </Tabs>
    </Card>
  )
}
