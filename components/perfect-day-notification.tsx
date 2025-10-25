"use client"

import { useEffect } from "react"
import { toast } from "sonner"
import { Sparkles } from "lucide-react"

interface PerfectDayNotificationProps {
  show: boolean
}

export function PerfectDayNotification({ show }: PerfectDayNotificationProps) {
  useEffect(() => {
    if (show) {
      toast.success("Perfect Day! 🎉", {
        description: "You've completed all three activity rings! 2x XP multiplier active tomorrow.",
        duration: 5000,
        icon: <Sparkles className="h-5 w-5 text-yellow-500" />,
      })
    }
  }, [show])

  return null
}
