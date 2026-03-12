import { createClient } from '@supabase/supabase-js'
import * as tty from 'tty'

// Disable colors for easy diffing
process.env.NO_COLOR = '1'

const MOCK_USERS_COUNT = 50
const NETWORK_LATENCY_MS = 10

const delay = (ms: number) => new Promise(res => setTimeout(res, ms))

const mockUsers = Array.from({ length: MOCK_USERS_COUNT }).map((_, i) => ({
  id: `user-${i}`,
  email: `user${i}@example.com`
}))

const mockProfiles = Object.fromEntries(mockUsers.map(u => [u.id, {
  id: u.id,
  email: u.email,
  subscription_tier: i % 3 === 0 ? 'pro' : 'free'
}]))

const mockLimits = [
  { tier: 'free', ai_picker_weekly_limit: 10, ai_bet_analyzer_weekly_limit: 5 },
  { tier: 'pro', ai_picker_weekly_limit: 100, ai_bet_analyzer_weekly_limit: 50 },
]

jest.mock('@supabase/supabase-js', () => {
  return {
    createClient: jest.fn().mockReturnValue({
      auth: {
        admin: {
          listUsers: jest.fn().mockImplementation(async () => {
            await delay(NETWORK_LATENCY_MS)
            return { data: { users: mockUsers }, error: null }
          })
        }
      },
      from: jest.fn().mockImplementation((table) => {
        let currentQuery = {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          in: jest.fn().mockReturnThis(),
          order: jest.fn().mockReturnThis(),
          single: jest.fn().mockImplementation(async () => {
             await delay(NETWORK_LATENCY_MS)
             if (table === 'user_profiles') {
               const id = currentQuery.eq.mock.calls.find(c => c[0] === 'id')?.[1]
               return { data: mockProfiles[id], error: null }
             }
             if (table === 'ai_usage_limits') {
               const tier = currentQuery.eq.mock.calls.find(c => c[0] === 'tier')?.[1]
               return { data: mockLimits.find(l => l.tier === tier), error: null }
             }
             return { data: null, error: null }
          }),
          then: jest.fn().mockImplementation(async (resolve, reject) => {
            await delay(NETWORK_LATENCY_MS)
            if (table === 'ai_usage_limits') {
               resolve({ data: mockLimits, error: null })
               return
            }
            if (table === 'user_profiles') {
               const ids = currentQuery.in.mock.calls.find(c => c[0] === 'id')?.[1]
               if (ids) {
                 resolve({ data: ids.map(id => mockProfiles[id]), error: null })
                 return
               }
            }
            if (table === 'ai_service_usage') {
               resolve({ count: 5, error: null }) // mock some usage
               return
            }
            resolve({ data: [], error: null })
          })
        }
        return currentQuery
      })
    })
  }
})

// Setup env
process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://mock'
process.env.SUPABASE_SERVICE_ROLE_KEY = 'mock'

// Run the script
const start = Date.now()

// override console.log to avoid spamming
const originalLog = console.log
const logs: string[] = []
console.log = (...args) => {
  // originalLog(...args)
  logs.push(args.join(' '))
}

import('./scripts/check-user-tier.ts').then(() => {
   // it runs automatically
   setTimeout(() => {
     originalLog(`Benchmark completed in ${Date.now() - start}ms`)
     originalLog(`Output lines: ${logs.length}`)
     // originalLog(logs.join('\n'))
   }, 3000)
}).catch(e => {
   originalLog('Error running script:', e)
})
