'use client'

import { useBilling } from '@flowglad/nextjs'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { FlowgladFeatureGate } from './flowglad-feature-gate'

/**
 * Example component showing how to use Flowglad billing hooks
 * This demonstrates the full billing API available from Flowglad
 */
export function FlowgladBillingExample() {
  const {
    customer,
    subscriptions,
    paymentMethods,
    createCheckoutSession,
    cancelSubscription,
    checkFeatureAccess,
    loaded,
    errors
  } = useBilling()

  // Loading state
  if (!loaded) {
    return <div>Loading billing data...</div>
  }

  // Error state
  if (errors && errors.length > 0) {
    return (
      <div className="text-red-500">
        Error loading billing: {errors[0].message}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Customer Info */}
      <Card className="p-4">
        <h3 className="font-semibold mb-2">Customer Information</h3>
        {customer ? (
          <div className="text-sm space-y-1">
            <p>Email: {customer.email}</p>
            <p>Name: {customer.name}</p>
            <p>ID: {customer.id}</p>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No customer data</p>
        )}
      </Card>

      {/* Active Subscriptions */}
      <Card className="p-4">
        <h3 className="font-semibold mb-2">Active Subscriptions</h3>
        {subscriptions && subscriptions.length > 0 ? (
          <div className="space-y-2">
            {subscriptions.map((sub) => (
              <div key={sub.id} className="border rounded p-3">
                <p className="font-medium">{sub.name}</p>
                <p className="text-sm text-muted-foreground">
                  Status: {sub.status}
                </p>
                <Button
                  size="sm"
                  variant="destructive"
                  className="mt-2"
                  onClick={() => cancelSubscription({ 
                    id: sub.id,
                    cancellation: { timing: 'at_end_of_current_billing_period' as const }
                  })}
                >
                  Cancel Subscription
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No active subscriptions</p>
        )}
      </Card>

      {/* Payment Methods */}
      <Card className="p-4">
        <h3 className="font-semibold mb-2">Payment Methods</h3>
        {paymentMethods && paymentMethods.length > 0 ? (
          <div className="space-y-2">
            {paymentMethods.map((method) => (
              <div key={method.id} className="text-sm">
                Payment method: {method.id}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No payment methods</p>
        )}
      </Card>

      {/* Create Checkout Session */}
      <Card className="p-4">
        <h3 className="font-semibold mb-2">Subscribe</h3>
        <Button
          onClick={() => {
            if (createCheckoutSession) {
              createCheckoutSession({
                successUrl: `${window.location.origin}?success=true`,
                cancelUrl: `${window.location.origin}?canceled=true`,
                priceId: 'price_xxxxx', // Replace with actual price ID
              })
            }
          }}
        >
          Subscribe to Premium
        </Button>
      </Card>

      {/* Feature Access Examples */}
      <Card className="p-4">
        <h3 className="font-semibold mb-2">Feature Access</h3>
        
        {/* Example: Premium Feature */}
        <FlowgladFeatureGate 
          featureId="premium_analytics"
          fallback={<p className="text-sm text-muted-foreground">Upgrade to Premium for analytics</p>}
        >
          <p className="text-sm text-green-600">✓ Premium Analytics Access</p>
        </FlowgladFeatureGate>

        {/* Example: Elite Feature */}
        <FlowgladFeatureGate 
          featureId="ai_picks"
          fallback={<p className="text-sm text-muted-foreground">Upgrade to Elite for AI picks</p>}
        >
          <p className="text-sm text-green-600">✓ AI Picks Access</p>
        </FlowgladFeatureGate>

        {/* Direct check example */}
        {checkFeatureAccess && (
          <div className="mt-4">
            <p className="text-sm">
              Direct check: {checkFeatureAccess("premium_analytics") ? "✓ Has access" : "✗ No access"}
            </p>
          </div>
        )}
      </Card>
    </div>
  )
}
