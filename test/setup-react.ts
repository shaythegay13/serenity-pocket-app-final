/**
 * Jest setup file for React component tests
 */

import '@testing-library/jest-dom'

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
  }),
  useSearchParams: () => ({
    get: jest.fn(),
  }),
  usePathname: () => '/',
}))

// Mock next/image - using createElement instead of JSX for .ts file compatibility
jest.mock('next/image', () => ({
  __esModule: true,
  default: function MockImage(props: { alt?: string; src?: string; [key: string]: unknown }) {
    // Use createElement instead of JSX to avoid needing .tsx extension
    return require('react').createElement('img', {
      ...props,
      alt: props.alt || '',
    })
  },
}))

// Mock Supabase client
jest.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: jest.fn().mockResolvedValue({ data: { session: null } }),
      onAuthStateChange: jest.fn().mockReturnValue({ data: { subscription: { unsubscribe: jest.fn() } } }),
      signInWithPassword: jest.fn(),
      signOut: jest.fn(),
    },
    from: jest.fn().mockReturnValue({
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: null, error: null }),
    }),
  },
}))

// Mock storage-hybrid
jest.mock('@/lib/storage-hybrid', () => ({
  storageHybrid: {
    getUserData: jest.fn().mockResolvedValue(null),
    setUserData: jest.fn().mockResolvedValue(undefined),
    getEmotionLogs: jest.fn().mockResolvedValue([]),
    getBetAnalyses: jest.fn().mockResolvedValue([]),
    getBiasProfile: jest.fn().mockResolvedValue(null),
    getChallenges: jest.fn().mockResolvedValue([]),
    getAchievements: jest.fn().mockResolvedValue([]),
  },
}))

// Suppress React 18 console warnings in tests
const originalError = console.error
beforeAll(() => {
  console.error = (...args: unknown[]) => {
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('ReactDOM.render is no longer supported') ||
        args[0].includes('Warning: ReactDOM.render'))
    ) {
      return
    }
    originalError.call(console, ...args)
  }
})

afterAll(() => {
  console.error = originalError
})
