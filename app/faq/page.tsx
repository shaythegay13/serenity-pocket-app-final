import { Metadata } from "next"
import { Card } from "@/components/ui/card"

export const metadata: Metadata = {
  title: "FAQ | Serenity Pocket - Frequently Asked Questions",
  description: "Find answers to common questions about Serenity Pocket's AI betting analysis, emotion tracking, subscription plans, and responsible gambling tools.",
  keywords: ["betting FAQ", "sports betting questions", "responsible gambling FAQ", "AI betting analysis help"],
}

const faqs = [
  {
    question: "What is Serenity Pocket?",
    answer: "Serenity Pocket is an AI-powered sports betting analytics platform designed to help you make smarter, more informed betting decisions. We combine behavioral psychology insights with real-time sports data to provide comprehensive analysis and responsible gaming tools."
  },
  {
    question: "How does the AI analysis work?",
    answer: "Our AI analyzes your betting patterns, emotional state, and historical performance alongside real-time sports data. This helps identify potential biases, emotional triggers, and provides personalized recommendations to improve your betting strategy."
  },
  {
    question: "Is Serenity Pocket legal to use?",
    answer: "Yes, Serenity Pocket is completely legal. We provide analytics and insights to help inform your betting decisions, but we do not place bets on your behalf. We operate as an educational and analytical tool."
  },
  {
    question: "What sports do you cover?",
    answer: "We currently cover NFL, NBA, NHL, and MLB. Our odds comparison includes data from all major sportsbooks for these leagues. We plan to expand to more sports in the future."
  },
  {
    question: "How does the emotion tracking work?",
    answer: "Our emotion tracking system uses periodic check-ins to monitor your emotional state before and after bets. This helps identify patterns between emotions and betting performance, enabling you to make more rational decisions."
  },
  {
    question: "Can I cancel my subscription anytime?",
    answer: "Yes, you can cancel your subscription at any time. Your access will continue until the end of your current billing period, and you won't be charged again."
  },
  {
    question: "How accurate are the AI picks?",
    answer: "Our AI picks provide probability-based recommendations with confidence scores. While no prediction is 100% accurate, our system consistently outperforms random chance by analyzing multiple factors including historical data, line movements, and behavioral patterns."
  },
  {
    question: "What is Cooldown Mode?",
    answer: "Cooldown Mode is a safety feature that automatically limits certain platform functions when our system detects high emotional volatility or concerning betting patterns. This helps prevent impulsive decisions and promotes responsible gaming."
  },
  {
    question: "How do you protect my data?",
    answer: "We use industry-standard encryption and security measures to protect your personal and betting data. Your information is never shared with third parties without your explicit consent, and we comply with all relevant privacy regulations."
  },
  {
    question: "Can I use Serenity Pocket on mobile?",
    answer: "Yes! Serenity Pocket is fully responsive and works great on mobile devices."
  },
  {
    question: "What payment methods do you accept?",
    answer: "We accept all major credit cards, debit cards, and PayPal through our secure payment processor. All transactions are encrypted and secure."
  }
]

export default function FAQPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-foreground mb-4">
              Frequently Asked Questions
            </h1>
            <p className="text-lg text-muted-foreground">
              Find answers to common questions about Serenity Pocket
            </p>
          </div>

          <div className="space-y-6">
            {faqs.map((faq, index) => (
              <Card key={index} className="p-6">
                <h3 className="text-lg font-semibold text-foreground mb-3">
                  {faq.question}
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  {faq.answer}
                </p>
              </Card>
            ))}
          </div>

          <div className="mt-12 text-center">
            <Card className="p-8 bg-muted/50">
              <h3 className="text-xl font-semibold text-foreground mb-4">
                Still have questions?
              </h3>
              <p className="text-muted-foreground mb-6">
                Can't find what you're looking for? Our support team is here to help.
              </p>
              <a
                href="/contact"
                className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
              >
                Contact Support
              </a>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
