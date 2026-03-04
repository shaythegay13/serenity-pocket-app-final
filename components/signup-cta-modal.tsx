'use client'

import { useRouter } from 'next/navigation'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Brain, TrendingUp, Shield, BarChart3 } from 'lucide-react'

const DISMISSED_KEY = 'pml_signup_cta_dismissed'

interface SignupCTAModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  featureUsed: 'check-in' | 'serenity-survey' | 'pgsi-survey'
  resultSummary?: string
}

const featureMessages: Record<string, { title: string; subtitle: string }> = {
  'check-in': {
    title: 'Your Emotional Check-In is Complete',
    subtitle: 'Create a free account to track your emotions over time and see how they impact your betting decisions.',
  },
  'serenity-survey': {
    title: 'Your Betting Archetype Has Been Revealed',
    subtitle: 'Create a free account to save your archetype, track your progress, and get personalized AI insights.',
  },
  'pgsi-survey': {
    title: 'Your PGSI Assessment is Complete',
    subtitle: 'Create a free account to save your results and access responsible gambling tools tailored to your risk level.',
  },
}

export function SignupCTAModal({ open, onOpenChange, featureUsed, resultSummary }: SignupCTAModalProps) {
  const router = useRouter()
  const message = featureMessages[featureUsed]

  const handleCreateAccount = () => {
    // Go directly to /home with signup flow (skip intermediate landing page)
    router.push('/home?signup=true')
  }

  const handleMaybeLater = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(DISMISSED_KEY, Date.now().toString())
    }
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-[#020617] border-white/10 text-white">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-white text-center">
            {message.title}
          </DialogTitle>
          <DialogDescription className="text-gray-400 text-center text-base mt-2">
            {message.subtitle}
          </DialogDescription>
        </DialogHeader>

        {resultSummary && (
          <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-center">
            <p className="text-sm text-gray-300">{resultSummary}</p>
          </div>
        )}

        <div className="space-y-3 py-4">
          <div className="flex items-start gap-3">
            <TrendingUp className="h-5 w-5 text-blue-400 mt-0.5 shrink-0" />
            <p className="text-sm text-gray-300">Track your progress and see trends over time</p>
          </div>
          <div className="flex items-start gap-3">
            <Brain className="h-5 w-5 text-purple-400 mt-0.5 shrink-0" />
            <p className="text-sm text-gray-300">Unlock AI-powered betting recommendations</p>
          </div>
          <div className="flex items-start gap-3">
            <BarChart3 className="h-5 w-5 text-green-400 mt-0.5 shrink-0" />
            <p className="text-sm text-gray-300">See how your emotions correlate with betting outcomes</p>
          </div>
          <div className="flex items-start gap-3">
            <Shield className="h-5 w-5 text-amber-400 mt-0.5 shrink-0" />
            <p className="text-sm text-gray-300">Access responsible gambling tools and safeguards</p>
          </div>
        </div>

        <div className="space-y-3 pt-2">
          <Button
            onClick={handleCreateAccount}
            className="w-full h-12 text-lg font-bold rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
          >
            Create Free Account
          </Button>
          <button
            type="button"
            onClick={handleMaybeLater}
            className="w-full text-sm text-gray-500 hover:text-gray-300 transition-colors py-2"
          >
            Maybe later
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
