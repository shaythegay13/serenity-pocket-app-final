import { execSync } from 'child_process';
import { createClient } from '@supabase/supabase-js';

const MOCK_USERS_COUNT = 50;
const NETWORK_LATENCY_MS = 10;

const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

const mockUsers = Array.from({ length: MOCK_USERS_COUNT }).map((_, i) => ({
  id: `user-${i}`,
  email: `user${i}@example.com`
}));

const mockProfiles = Object.fromEntries(mockUsers.map(u => [u.id, {
  id: u.id,
  email: u.email,
  subscription_tier: u.id.endsWith('0') ? 'pro' : 'free'
}]));

const mockLimits = [
  { tier: 'free', ai_picker_weekly_limit: 10, ai_bet_analyzer_weekly_limit: 5 },
  { tier: 'pro', ai_picker_weekly_limit: 100, ai_bet_analyzer_weekly_limit: 50 },
];

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn().mockReturnValue({
    auth: {
      admin: {
        listUsers: jest.fn().mockImplementation(async () => {
          await delay(NETWORK_LATENCY_MS);
          return { data: { users: mockUsers }, error: null };
        })
      }
    },
    from: jest.fn().mockImplementation((table) => {
      let currentQuery: any = {};
      const buildQuery = (method: string) => (...args: any[]) => {
          currentQuery[method] = args;
          return queryObj;
      };

      const execute = async (isSingle: boolean) => {
          await delay(NETWORK_LATENCY_MS);
          if (table === 'user_profiles') {
              if (isSingle) {
                  const id = currentQuery.eq?.[1];
                  return { data: mockProfiles[id] || null, error: null };
              } else {
                  const ids = currentQuery.in?.[1] || [];
                  return { data: ids.map((id: string) => mockProfiles[id]).filter(Boolean), error: null };
              }
          }
          if (table === 'ai_usage_limits') {
              if (isSingle) {
                  const tier = currentQuery.eq?.[1];
                  return { data: mockLimits.find(l => l.tier === tier) || null, error: null };
              } else {
                  return { data: mockLimits, error: null };
              }
          }
          if (table === 'ai_service_usage') {
              return { count: 5, error: null };
          }
          return { data: [], error: null };
      };

      const queryObj = {
        select: buildQuery('select'),
        eq: buildQuery('eq'),
        in: buildQuery('in'),
        order: buildQuery('order'),
        single: async () => execute(true),
        then: jest.fn().mockImplementation(function(this: any, resolve: any, reject: any) {
            execute(false).then(resolve).catch(reject)
        })
      };
      return queryObj;
    })
  })
}));

describe('check-user-tier benchmark', () => {
  let mockConsoleLog: any;

  beforeEach(() => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://mock';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'mock';
    mockConsoleLog = jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterAll(() => {
      jest.restoreAllMocks();
  })

  it('runs the script and measures real time based on completion log', async () => {
    const start = Date.now();
    let complete = false;

    // Setup a hook to know when it finishes (since it's an async IIFE we can't easily await it without exporting)
    mockConsoleLog.mockImplementation((msg: string) => {
      if (typeof msg === 'string' && msg.includes('All Tier Limits')) {
        complete = true;
      }
    });

    // Import the file directly so the mocks take effect
    require('../scripts/check-user-tier.ts');

    // wait for it to finish
    while (!complete) {
       await delay(100);
       if (Date.now() - start > 5000) break; // timeout
    }

    const duration = Date.now() - start;
    process.stdout.write(`\n--- BENCHMARK RESULTS ---\nTime taken: ${duration}ms\n-------------------------\n`);

  }, 10000);
});
