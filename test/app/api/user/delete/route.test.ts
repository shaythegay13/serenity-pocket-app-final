import { POST } from '@/app/api/user/delete/route';
import { NextRequest } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';

jest.mock('@/lib/supabase-server', () => {
  const deleteMock = jest.fn().mockReturnValue({ error: null });
  const eqMock = jest.fn().mockReturnValue({ delete: deleteMock });

  return {
    supabaseServer: {
      auth: {
        getUser: jest.fn(),
        admin: {
          deleteUser: jest.fn().mockResolvedValue({ error: null }),
        },
      },
      from: jest.fn().mockReturnValue({
        delete: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ error: null })
        })
      }),
    },
  };
});

describe('User Delete API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should successfully delete user and related data', async () => {
    // Mock user
    const mockUser = { id: 'user-123' };
    (supabaseServer.auth.getUser as jest.Mock).mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });

    // Mock request
    const mockRequest = new NextRequest('http://localhost:3000/api/user/delete', {
      method: 'POST',
      headers: new Headers({
        authorization: 'Bearer valid-token',
      }),
    });

    const response = await POST(mockRequest);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({ success: true });

    // Check if tables are deleted
    expect(supabaseServer.from).toHaveBeenCalledWith('emotion_logs');
    expect(supabaseServer.from).toHaveBeenCalledWith('trades');
    expect(supabaseServer.from).toHaveBeenCalledWith('user_profiles');

    expect(supabaseServer.auth.admin.deleteUser).toHaveBeenCalledWith('user-123');
  });
});
