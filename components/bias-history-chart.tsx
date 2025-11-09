"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"
import type { BiasQuizHistory, BiasProfile } from "@/lib/types"
import { format } from "date-fns"

interface BiasHistoryChartProps {
  history: BiasQuizHistory[]
}

const biasColors = {
  confirmationBias: "#3b82f6",
  lossAversion: "#ef4444",
  anchoringBias: "#f59e0b",
  recencyBias: "#10b981",
  overconfidenceBias: "#8b5cf6",
  herdMentality: "#ec4899",
}

const biasLabels = {
  confirmationBias: "Confirmation",
  lossAversion: "Loss Aversion",
  anchoringBias: "Anchoring",
  recencyBias: "Recency",
  overconfidenceBias: "Overconfidence",
  herdMentality: "Herd Mentality",
}

// Custom tick component that uses theme-aware colors
const CustomTick = ({ x, y, payload, isYAxis }: any) => {
  const [color, setColor] = useState('rgb(0, 0, 0)')
  
  useEffect(() => {
    const updateColor = () => {
      if (typeof window !== 'undefined') {
        const computedStyle = getComputedStyle(document.documentElement)
        const hslValue = computedStyle.getPropertyValue('--foreground').trim()
        // Convert HSL to RGB for better compatibility
        const tempDiv = document.createElement('div')
        tempDiv.style.color = `hsl(${hslValue})`
        document.body.appendChild(tempDiv)
        const rgbColor = getComputedStyle(tempDiv).color
        document.body.removeChild(tempDiv)
        setColor(rgbColor)
      }
    }
    
    updateColor()
    
    const observer = new MutationObserver(updateColor)
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class', 'data-theme'] })
    
    return () => observer.disconnect()
  }, [])
  
  return (
    <text 
      x={x} 
      y={y} 
      dy={isYAxis ? 4 : 16} 
      textAnchor={isYAxis ? 'end' : 'middle'}
      fill={color}
      fontSize={12}
    >
      {payload.value}
    </text>
  )
}

export function BiasHistoryChart({ history }: BiasHistoryChartProps) {
  // Get theme-aware text color that updates when theme changes
  const [axisColor, setAxisColor] = useState('hsl(0 0% 0%)')

  useEffect(() => {
    const updateColor = () => {
      if (typeof window !== 'undefined') {
        const textColor = getComputedStyle(document.documentElement).getPropertyValue('--foreground').trim()
        setAxisColor(`hsl(${textColor})`)
      }
    }
    
    updateColor()
    
    // Listen for theme changes
    const observer = new MutationObserver(updateColor)
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class', 'data-theme'] })
    
    return () => observer.disconnect()
  }, [])

  if (history.length === 0) {
    return (
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">Bias Awareness Progress</h3>
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <p className="text-muted-foreground mb-2">No quiz history yet</p>
          <p className="text-sm text-muted-foreground">
            Complete the bias quiz multiple times to track your progress over time
          </p>
        </div>
      </Card>
    )
  }

  if (history.length === 1) {
    return (
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">Bias Awareness Progress</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {Object.entries(history[0].profile).map(([bias, score]) => (
            <div key={bias} className="text-center p-4 rounded-lg bg-muted">
              <p className="text-2xl font-bold" style={{ color: biasColors[bias as keyof typeof biasColors] }}>
                {Math.round(score)}
              </p>
              <p className="text-sm text-muted-foreground">{biasLabels[bias as keyof typeof biasLabels]}</p>
            </div>
          ))}
        </div>
        <p className="text-sm text-muted-foreground mt-4 text-center">
          Complete Quiz #2 to see your bias trends over time
        </p>
      </Card>
    )
  }

  // Prepare data for chart - sort by timestamp
  const sortedHistory = [...history].sort((a, b) => 
    new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  )

  const chartData = sortedHistory.map((entry, index) => ({
    quizNumber: index + 1,
    date: format(new Date(entry.timestamp), "MMM d, yyyy"),
    confirmationBias: Math.round(entry.profile.confirmationBias),
    lossAversion: Math.round(entry.profile.lossAversion),
    anchoringBias: Math.round(entry.profile.anchoringBias),
    recencyBias: Math.round(entry.profile.recencyBias),
    overconfidenceBias: Math.round(entry.profile.overconfidenceBias),
    herdMentality: Math.round(entry.profile.herdMentality),
    average: entry.averageScore,
  }))

  // Calculate improvement
  const firstAvg = sortedHistory[0].averageScore
  const lastAvg = sortedHistory[sortedHistory.length - 1].averageScore
  const improvement = firstAvg - lastAvg // Lower bias = better, so positive improvement means scores went down
  const improvementPercent = firstAvg > 0 ? Math.round((improvement / firstAvg) * 100) : 0

  return (
    <Card className="p-6">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-foreground">Bias Awareness Progress</h3>
            <p className="text-xs text-muted-foreground">Track bias changes across {history.length} quiz{history.length > 1 ? 'zes' : ''}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Improvement</p>
            <p className={`text-2xl font-bold ${improvementPercent > 0 ? 'text-green-600' : improvementPercent < 0 ? 'text-red-600' : 'text-muted-foreground'}`}>
              {improvementPercent > 0 ? '+' : ''}{improvementPercent}%
            </p>
          </div>
        </div>

        <ResponsiveContainer width="100%" height={350}>
          <LineChart data={chartData} margin={{ top: 5, right: 130, left: 0, bottom: 25 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis 
              dataKey="quizNumber" 
              stroke="hsl(var(--muted-foreground))"
              tickFormatter={(value) => `Quiz #${value}`}
              tick={(props) => <CustomTick {...props} isYAxis={false} />}
              label={{ value: 'Quiz Number', position: 'insideBottom', offset: -15, style: { fontSize: '12px', fill: axisColor } }}
            />
            <YAxis 
              stroke="hsl(var(--muted-foreground))"
              domain={[0, 100]}
              ticks={[0, 25, 50, 75, 100]}
              tickFormatter={(value) => `${value}%`}
              tick={(props) => <CustomTick {...props} isYAxis={true} />}
              label={{ value: 'Bias %', angle: -90, position: 'insideLeft', style: { fontSize: '12px', fill: axisColor } }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
              }}
              labelFormatter={(value) => {
                const entry = chartData.find(d => d.quizNumber === value)
                return entry ? `Quiz #${value} (${entry.date})` : `Quiz #${value}`
              }}
              formatter={(value: number, name: string) => [
                `${value}%`,
                biasLabels[name as keyof typeof biasLabels] || name
              ]}
            />
            <Legend 
              layout="vertical"
              align="right"
              verticalAlign="middle"
              wrapperStyle={{ fontSize: '11px', color: axisColor, paddingLeft: '10px' }}
              formatter={(value) => biasLabels[value as keyof typeof biasLabels] || value}
            />
            {Object.keys(biasColors).map((bias) => (
              <Line
                key={bias}
                type="monotone"
                dataKey={bias}
                stroke={biasColors[bias as keyof typeof biasColors]}
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 pt-4 border-t">
          {(Object.keys(biasLabels) as Array<keyof typeof biasLabels>).map((key) => {
            const label = biasLabels[key]
            const biasKey = key as keyof BiasProfile
            const first = sortedHistory[0].profile[biasKey]
            const last = sortedHistory[sortedHistory.length - 1].profile[biasKey]
            const change = first - last
            return (
              <div key={key} className="text-center p-3 rounded-lg bg-muted">
                <p className="text-xs text-muted-foreground mb-1">{label}</p>
                <p className="text-lg font-bold" style={{ color: biasColors[key as keyof typeof biasColors] }}>
                  {Math.round(last)}
                </p>
                <p className={`text-xs ${change > 0 ? 'text-green-600' : change < 0 ? 'text-red-600' : 'text-muted-foreground'}`}>
                  {change > 0 ? '↓' : change < 0 ? '↑' : '→'} {Math.abs(Math.round(change))}
                </p>
              </div>
            )
          })}
        </div>

        <p className="text-sm text-muted-foreground text-center">
          Lower bias % = Better awareness • Hover over chart to see dates
        </p>
      </div>
    </Card>
  )
}
