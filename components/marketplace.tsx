"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Brain, ShoppingCart, RefreshCw, Zap } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"
import { AIUsageIndicator } from "@/components/ai-usage-indicator"
import { DECISION_PRICING } from "@/lib/decision-pricing"

interface MarketplaceProduct {
  id: string
  product_key: string
  display_name: string
  description: string
  price: number
  decision_credits: number
  // legacy fields kept for type compatibility
  ai_picker_credits: number
  ai_bet_analyzer_credits: number
  is_bundle: boolean
}

interface MarketplaceProps {
  userData: any
}

/** Cost per individual decision (single pack) used for savings display */
const SINGLE_DECISION_PRICE = DECISION_PRICING.single.price

function calculateSavings(product: MarketplaceProduct): string {
  if (product.decision_credits <= 1) return '0.00'
  const fullPrice = product.decision_credits * SINGLE_DECISION_PRICE
  return Math.max(0, fullPrice - product.price).toFixed(2)
}

export function Marketplace({ userData }: MarketplaceProps) {
  const router = useRouter()
  const [marketplaceProducts, setMarketplaceProducts] = useState<MarketplaceProduct[]>([])
  const [marketplaceLoading, setMarketplaceLoading] = useState(true)
  const [marketplacePurchasing, setMarketplacePurchasing] = useState<string | null>(null)

  useEffect(() => {
    fetchMarketplaceProducts()
  }, [])

  const fetchMarketplaceProducts = async () => {
    setMarketplaceLoading(true)
    try {
      const res = await fetch('/api/marketplace/products')
      const data = await res.json()
      if (data?.success) {
        setMarketplaceProducts(data.products || [])
      } else {
        toast.error('Failed to load marketplace')
      }
    } catch (e) {
      toast.error('Failed to load marketplace')
    } finally {
      setMarketplaceLoading(false)
    }
  }

  const startMarketplacePurchase = async (productKey: string) => {
    setMarketplacePurchasing(productKey)
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session) {
        toast.info('Sign in required', {
          description: 'Please sign in to purchase AI-guided decisions.',
        })
        router.push("/pricing")
        return
      }

      const res = await fetch('/api/marketplace/purchase', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ productKey }),
      })

      const data = await res.json()
      if (data?.success && data.checkoutUrl) {
        window.location.href = data.checkoutUrl
        return
      }

      toast.error('Purchase failed', {
        description: data?.error || 'Failed to start checkout.',
      })
    } catch (e: any) {
      toast.error('Purchase failed', {
        description: e?.message || 'Failed to start checkout.',
      })
    } finally {
      setMarketplacePurchasing(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h3 className="text-2xl font-bold text-foreground">Buy AI-Guided Decisions</h3>
        <p className="text-muted-foreground">
          Purchase additional AI-guided decisions to analyze your next bet — beyond your weekly plan allocation.
        </p>
      </div>

      <div className="max-w-2xl mx-auto">
        <AIUsageIndicator />
      </div>

      {marketplaceLoading && (
        <Card className="p-8 text-center">
          <ShoppingCart className="h-10 w-10 text-muted-foreground mx-auto mb-3 animate-pulse" />
          <p className="text-sm text-muted-foreground">Loading marketplace…</p>
        </Card>
      )}

      {!marketplaceLoading && marketplaceProducts.length === 0 && (
        <Card className="p-8 text-center">
          <p className="text-sm text-muted-foreground">No products are available right now.</p>
          <div className="mt-4">
            <Button variant="outline" onClick={fetchMarketplaceProducts}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </Card>
      )}

      {!marketplaceLoading && marketplaceProducts.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {marketplaceProducts.map((product) => {
            const savings = calculateSavings(product)
            const hasSavings = parseFloat(savings) > 0

            return (
              <Card
                key={product.id}
                className={`p-6 flex flex-col transition-all hover:shadow-lg ${
                  hasSavings
                    ? 'border-purple-500/50 bg-linear-to-br from-purple-500/5 to-blue-500/5'
                    : ''
                }`}
              >
                {hasSavings && (
                  <Badge className="w-fit mb-3" variant="default">
                    <Zap className="h-3 w-3 mr-1" />
                    Save ${savings}
                  </Badge>
                )}

                <h4 className="text-lg font-semibold mb-2">{product.display_name}</h4>
                <p className="text-sm text-muted-foreground mb-4 grow">{product.description}</p>

                <div className="mb-4 space-y-2 text-sm">
                  {product.decision_credits > 0 && (
                    <div className="flex items-center gap-2">
                      <Brain className="h-4 w-4 text-purple-500" />
                      <span>
                        <span className="font-medium">
                          +{product.decision_credits} AI-guided decision
                          {product.decision_credits > 1 ? 's' : ''}
                        </span>
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between pt-4 border-t">
                  <div>
                    <span className="text-2xl font-bold tabular-nums">
                      ${product.price.toFixed(2)}
                    </span>
                    {hasSavings && (
                      <p className="text-xs text-muted-foreground">Best value!</p>
                    )}
                  </div>
                  <Button
                    onClick={() => startMarketplacePurchase(product.product_key)}
                    disabled={marketplacePurchasing === product.product_key}
                    className="gap-2"
                  >
                    <ShoppingCart className="h-4 w-4" />
                    {marketplacePurchasing === product.product_key ? 'Processing...' : 'Buy Now'}
                  </Button>
                </div>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
