import type { Metadata } from "next"
import { Card } from "@/components/ui/card"
import { AlertTriangle, Shield, Eye } from "lucide-react"
import { FooterPageWrapper } from "@/components/footer-page-wrapper"

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.playmindlabs.com'

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Responsible Use | PlayMind Labs",
    description: "Learn about PlayMind Labs' responsible gambling practices. Built-in safeguards including volatility warnings, cooldown mode, and transparent user protections for safer betting.",
    openGraph: {
      title: "Responsible Gambling – PlayMind Labs",
      description: "Harm reduction, clarity, and user protection are built in. Discover the safeguards that keep you in control of your betting.",
      url: `${BASE_URL}/responsible-use`,
      siteName: 'PlayMind Labs',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: "Responsible Gambling – PlayMind Labs",
      description: "Harm reduction, clarity, and user protection are built in. Discover the safeguards that keep you in control of your betting.",
    },
    alternates: {
      canonical: `${BASE_URL}/responsible-use`,
    },
  }
}

export default function ResponsibleUsePage() {
  return (
    <FooterPageWrapper>
      <div className="container mx-auto px-4 py-10 max-w-4xl">
      <div className="text-center space-y-2 mb-8">
        <h1 className="text-4xl font-bold text-foreground">Responsible Use</h1>
        <p className="text-muted-foreground">Harm reduction, clarity, and user protection are built-in.</p>
      </div>

      <div className="space-y-6">
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-3">
            <AlertTriangle className="h-6 w-6 text-orange-500" />
            <h3 className="text-xl font-semibold">Volatility Warnings</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            We surface contextual warnings during emotional volatility and losing streaks. Certain features will be limited until stability improves.
          </p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3 mb-3">
            <Shield className="h-6 w-6 text-green-500" />
            <h3 className="text-xl font-semibold">Cooldowns and Limits</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            Enable cooldown mode, set daily bet limits, and cap stake size. These settings apply across web and mobile and can’t be overridden by dark patterns.
          </p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3 mb-3">
            <Eye className="h-6 w-6 text-blue-500" />
            <h3 className="text-xl font-semibold">Transparency and Consent</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            We explain risk clearly, avoid predatory friction, and always provide context before sensitive actions. You control your data and privacy.
          </p>
        </Card>
      </div>
      </div>
    </FooterPageWrapper>
  )
}
