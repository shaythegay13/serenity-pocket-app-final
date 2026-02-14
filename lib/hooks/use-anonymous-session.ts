'use client'

import { useEffect, useState } from 'react'
import { getAnonymousSessionId } from '@/lib/anonymous-session'

/**
 * React hook that provides the anonymous session ID and syncs it
 * with the httpOnly cookie via the /api/anonymous-session endpoint.
 */
export function useAnonymousSession() {
  const [sessionId, setSessionId] = useState<string>('')
  const [synced, setSynced] = useState(false)

  useEffect(() => {
    const localId = getAnonymousSessionId()
    setSessionId(localId)

    // Sync with httpOnly cookie
    fetch(`/api/anonymous-session?clientId=${encodeURIComponent(localId)}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.sessionId) {
          setSessionId(data.sessionId)
        }
        setSynced(true)
      })
      .catch(() => {
        // Fail silently -- localStorage still works as primary
        setSynced(true)
      })
  }, [])

  return { sessionId, synced }
}
