'use client'

import { useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CheckCircle, ArrowRight } from 'lucide-react'

function SuccessContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const product = searchParams.get('product')

  useEffect(() => {
    // Confetti or celebration animation could go here
  }, [])

  return (
    <div className="container mx-auto py-16 px-4 max-w-2xl">
      <Card className="p-8 text-center">
        <div className="flex justify-center mb-6">
          <div className="rounded-full bg-green-500/20 p-4">
            <CheckCircle className="h-16 w-16 text-green-500" />
          </div>
        </div>

        <h1 className="text-3xl font-bold mb-3">Purchase Successful!</h1>
        <p className="text-muted-foreground mb-6">
          Your AI service credits have been added to your account and are ready to use.
        </p>

        {product && (
          <div className="bg-muted/50 rounded-lg p-4 mb-6">
            <p className="text-sm text-muted-foreground mb-1">You purchased:</p>
            <p className="font-semibold">{formatProductName(product)}</p>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button
            onClick={() => router.push('/')}
            variant="default"
            size="lg"
            className="gap-2"
          >
            Go to Dashboard
            <ArrowRight className="h-4 w-4" />
          </Button>
          <Button
            onClick={() => router.push('/marketplace')}
            variant="outline"
            size="lg"
          >
            Back to Marketplace
          </Button>
        </div>

        <p className="text-xs text-muted-foreground mt-6">
          You'll receive a confirmation email shortly with your purchase details.
        </p>
      </Card>
    </div>
  )
}

export default function MarketplaceSuccessPage() {
  return (
    <Suspense fallback={
      <div className="container mx-auto py-16 px-4 max-w-2xl">
        <Card className="p-8 text-center">
          <div className="flex justify-center mb-6">
            <div className="rounded-full bg-green-500/20 p-4">
              <CheckCircle className="h-16 w-16 text-green-500" />
            </div>
          </div>
          <h1 className="text-3xl font-bold mb-3">Loading...</h1>
        </Card>
      </div>
    }>
      <SuccessContent />
    </Suspense>
  )
}

function formatProductName(productKey: string): string {
  const names: Record<string, string> = {
    'single_picker': 'AI Picker - 1 Use',
    'single_analyzer': 'AI Bet Analyzer - 1 Use',
    'bundle_single': 'Bundle: Both Services - 1 Use Each',
    'double_picker': 'AI Picker - 2 Uses',
    'double_analyzer': 'AI Bet Analyzer - 2 Uses',
    'bundle_double': 'Bundle: Both Services - 2 Uses Each'
  }
  return names[productKey] || 'AI Service Credits'
}
