"use client"

import { Card } from "@/components/ui/card"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { AlertCircle, Lightbulb, Shield } from "lucide-react"

const biasEducation = [
  {
    id: "confirmation",
    name: "Confirmation Bias",
    icon: AlertCircle,
    description: "The tendency to search for, interpret, and recall information that confirms pre-existing beliefs.",
    examples: [
      "Only reading bullish news about a stock you own",
      "Ignoring warning signs that contradict your thesis",
      "Seeking opinions from people who agree with you",
    ],
    mitigation: [
      "Actively seek contradicting information",
      "Play devil's advocate with your own ideas",
      "Keep a decision journal to review later",
      "Set up alerts for both positive and negative news",
    ],
  },
  {
    id: "loss-aversion",
    name: "Loss Aversion",
    icon: Shield,
    description: "The tendency to prefer avoiding losses over acquiring equivalent gains.",
    examples: [
      "Holding losing positions too long hoping to break even",
      "Selling winners too early to lock in gains",
      "Avoiding necessary stop losses",
    ],
    mitigation: [
      "Set stop losses before entering trades",
      "Focus on risk-reward ratios, not just outcomes",
      "Accept that losses are part of trading",
      "Review trades based on process, not results",
    ],
  },
  {
    id: "anchoring",
    name: "Anchoring Bias",
    icon: Lightbulb,
    description: "Over-relying on the first piece of information encountered when making decisions.",
    examples: [
      "Fixating on your entry price",
      "Using 52-week highs as price targets",
      "Basing decisions on initial analyst price targets",
    ],
    mitigation: [
      "Regularly reassess positions with fresh analysis",
      "Use multiple timeframes and perspectives",
      "Focus on current market conditions, not past prices",
      "Set price alerts instead of watching constantly",
    ],
  },
  {
    id: "recency",
    name: "Recency Bias",
    icon: AlertCircle,
    description: "Giving more weight to recent events than historical data.",
    examples: [
      "Assuming a winning streak will continue",
      "Changing strategy after a few losses",
      "Overreacting to recent market volatility",
    ],
    mitigation: [
      "Review long-term performance data",
      "Maintain a trading journal with historical context",
      "Stick to your trading plan through ups and downs",
      "Use statistical analysis over gut feelings",
    ],
  },
  {
    id: "overconfidence",
    name: "Overconfidence Bias",
    icon: Shield,
    description: "Overestimating your knowledge, abilities, or the precision of your predictions.",
    examples: ["Taking oversized positions", "Trading without stop losses", "Ignoring risk management rules"],
    mitigation: [
      "Track your actual win rate vs. perceived accuracy",
      "Use position sizing rules consistently",
      "Seek feedback from other traders",
      "Maintain humility and continuous learning",
    ],
  },
  {
    id: "herd",
    name: "Herd Mentality",
    icon: Lightbulb,
    description: "Following the crowd without independent analysis or critical thinking.",
    examples: [
      "Buying stocks because everyone else is",
      "Following social media hype without research",
      "Panic selling during market crashes",
    ],
    mitigation: [
      "Do your own research before every trade",
      "Limit exposure to social media noise",
      "Have a contrarian mindset when appropriate",
      "Focus on your strategy, not others' actions",
    ],
  },
]

export function BiasEducation() {
  return (
    <Card className="p-6">
      <h3 className="text-xl font-semibold text-foreground mb-4">Understanding Cognitive Biases</h3>
      <Accordion type="single" collapsible className="w-full">
        {biasEducation.map((bias) => (
          <AccordionItem key={bias.id} value={bias.id}>
            <AccordionTrigger className="text-left">
              <div className="flex items-center gap-3">
                <bias.icon className="h-5 w-5 text-primary" />
                <span className="font-semibold">{bias.name}</span>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-4 pt-2">
                <p className="text-sm text-muted-foreground">{bias.description}</p>

                <div>
                  <h5 className="font-medium text-foreground mb-2">Common Examples:</h5>
                  <ul className="space-y-1">
                    {bias.examples.map((example, i) => (
                      <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                        <span className="text-primary mt-1">•</span>
                        <span>{example}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h5 className="font-medium text-foreground mb-2">How to Mitigate:</h5>
                  <ul className="space-y-1">
                    {bias.mitigation.map((tip, i) => (
                      <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                        <span className="text-teal mt-1">✓</span>
                        <span>{tip}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </Card>
  )
}
