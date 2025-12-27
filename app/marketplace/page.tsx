'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ShoppingCart, Sparkles, ArrowLeft, Check } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { AIUsageIndicator } from '@/components/ai-usage-indicator'

interface MarketplaceProduct {
  id: string
  product_key: string
  display_name: string
  description: string
  price: number
  ai_picker_credits: number
  ai_bet_analyzer_credits: number
  is_bundle: boolean
}

export default function MarketplacePage() {
  const [products, setProducts] = useState<MarketplaceProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [purchasing, setPurchasing] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    fetchProducts()
  }, [])

  async function fetchProducts() {
    try {
      const res = await fetch('/api/marketplace/products')
      const data = await res.json()
      
      if (data.success) {
        setProducts(data.products || [])
      }
    } catch (error) {
      console.error('Failed to fetch products:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handlePurchase(productKey: string) {
    setPurchasing(productKey)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/?tab=account')
        return
      }

      const res = await fetch('/api/marketplace/purchase', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ productKey })
      })

      const data = await res.json()
      
      if (data.success && data.checkoutUrl) {
        window.location.href = data.checkoutUrl
      } else {
        console.error('Purchase failed:', data.error)
        alert('Failed to start checkout. Please try again.')
      }
    } catch (error) {
      console.error('Purchase failed:', error)
      alert('Failed to start checkout. Please try again.')
    } finally {
      setPurchasing(null)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-64 mb-4"></div>
          <div className="h-4 bg-muted rounded w-96 mb-8"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-64 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push('/')}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>
        
        <h1 className="text-3xl font-bold mb-2">AI Services Marketplace</h1>
        <p className="text-muted-foreground">
          Need more AI analyses this week? Purchase additional uses here.
        </p>
      </div>

      {/* Usage Indicator */}
      <div className="max-w-2xl mb-8">
        <AIUsageIndicator />
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map((product) => (
          <Card 
            key={product.id} 
            className={`p-6 flex flex-col transition-all hover:shadow-lg ${
              product.is_bundle ? 'border-purple-500/50 bg-linear-to-br from-purple-500/5 to-blue-500/5' : ''
            }`}
          >
            {product.is_bundle && (
              <Badge className="w-fit mb-3 bg-linear-to-r from-purple-500 to-blue-500" variant="default">
                <Sparkles className="h-3 w-3 mr-1" />
                Bundle Deal - Save ${calculateSavings(product)}
              </Badge>
            )}
            
            <h3 className="text-xl font-semibold mb-2">{product.display_name}</h3>
            <p className="text-sm text-muted-foreground mb-4 grow">
              {product.description}
            </p>

            <div className="mb-4 space-y-2 text-sm">
              {product.ai_picker_credits > 0 && (
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500" />
                  <span>SmartSlip: <span className="font-medium">+{product.ai_picker_credits} use{product.ai_picker_credits > 1 ? 's' : ''}</span></span>
                </div>
              )}
              {product.ai_bet_analyzer_credits > 0 && (
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500" />
                  <span>TiltLab: <span className="font-medium">+{product.ai_bet_analyzer_credits} use{product.ai_bet_analyzer_credits > 1 ? 's' : ''}</span></span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-4 border-t">
              <div>
                <span className="text-2xl font-bold">${product.price.toFixed(2)}</span>
                {product.is_bundle && (
                  <p className="text-xs text-muted-foreground">Best value!</p>
                )}
              </div>
              <Button
                onClick={() => handlePurchase(product.product_key)}
                disabled={purchasing === product.product_key}
                className="gap-2"
              >
                <ShoppingCart className="h-4 w-4" />
                {purchasing === product.product_key ? 'Processing...' : 'Buy Now'}
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {/* Info Section */}
      <Card className="mt-8 p-6 bg-muted/50">
        <h3 className="text-lg font-semibold mb-3">How It Works</h3>
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li className="flex items-start gap-2">
            <Check className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
            <span>Purchase additional AI service uses on top of your subscription tier limits</span>
          </li>
          <li className="flex items-start gap-2">
            <Check className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
            <span>Credits are added immediately after payment and never expire</span>
          </li>
          <li className="flex items-start gap-2">
            <Check className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
            <span>Bundle deals offer the best value when you need both services</span>
          </li>
          <li className="flex items-start gap-2">
            <Check className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
            <span>Tier limits reset every Monday, but purchased credits remain available</span>
          </li>
        </ul>
      </Card>
    </div>
  )
}

// Helper function to calculate savings for bundle deals
function calculateSavings(product: MarketplaceProduct): string {
  if (!product.is_bundle) return '0.00'
  
  // Calculate what it would cost to buy separately
  const singlePickerPrice = 30
  const singleAnalyzerPrice = 30
  
  const separateTotal = 
    (product.ai_picker_credits * singlePickerPrice) + 
    (product.ai_bet_analyzer_credits * singleAnalyzerPrice)
  
  const savings = separateTotal - product.price
  return savings.toFixed(2)
}
