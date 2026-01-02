import { Card } from "@/components/ui/card"
import { AuthenticatedLayout } from "@/components/authenticated-layout"

export default function DemoPage() {
  return (
    <AuthenticatedLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-foreground mb-4">
              Platform Demo
            </h1>
            <p className="text-lg text-muted-foreground">
              Learn how to use Serenity Pocket to make smarter betting decisions
            </p>
          </div>

          <Card className="p-12 text-center">
            <div className="space-y-6">
              <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center">
                <svg
                  className="w-8 h-8 text-muted-foreground"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                  />
                </svg>
              </div>
              
              <h2 className="text-2xl font-semibold text-foreground">
                This content is still being developed
              </h2>
              
              <p className="text-muted-foreground max-w-md mx-auto">
                We're working on creating comprehensive video tutorials and interactive demos to help you get the most out of Serenity Pocket. Check back soon!
              </p>

              <div className="pt-6">
                <p className="text-sm text-muted-foreground mb-4">
                  In the meantime, explore these resources:
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <a
                    href="/features"
                    className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
                  >
                    View Features
                  </a>
                  <a
                    href="/faq"
                    className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2"
                  >
                    Read FAQs
                  </a>
                </div>
              </div>
            </div>
          </Card>

          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-foreground mb-2">
                📊 Analytics Dashboard
              </h3>
              <p className="text-muted-foreground text-sm">
                Track your betting performance and identify patterns in your behavior.
              </p>
            </Card>
            
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-foreground mb-2">
                🤖 AI-Powered Insights
              </h3>
              <p className="text-muted-foreground text-sm">
                Get personalized recommendations based on your unique betting profile.
              </p>
            </Card>
            
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-foreground mb-2">
                🎯 Responsible Gaming Tools
              </h3>
              <p className="text-muted-foreground text-sm">
                Stay in control with emotion tracking and safety features.
              </p>
            </Card>
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  )
}
