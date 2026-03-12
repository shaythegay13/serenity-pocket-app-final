import { POST } from '@/app/api/user/delete/route';
import { NextRequest } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';

jest.mock('@/lib/supabase-server', () => {
  // Simulate database latency
  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
  const eqMock = jest.fn().mockImplementation(async () => {
    await delay(100); // 100ms per delete
    return { error: null };
  });

  return {
    supabaseServer: {
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: { id: 'test-user-id' } },
          error: null,
        }),
        admin: {
          deleteUser: jest.fn().mockResolvedValue({ error: null }),
        },
      },
      from: jest.fn().mockReturnValue({
        delete: jest.fn().mockReturnValue({
          eq: eqMock
        })
      }),
    },
  };
});

describe('Benchmark User Delete API', () => {
  it('measures execution time', async () => {
    const mockRequest = new NextRequest('http://localhost:3000/api/user/delete', {
      method: 'POST',
      headers: new Headers({
        authorization: 'Bearer valid-token',
      }),
    });

    const start = Date.now();
    await POST(mockRequest);
    const end = Date.now();

    console.log(`Execution time: ${end - start}ms`);
  });
});
