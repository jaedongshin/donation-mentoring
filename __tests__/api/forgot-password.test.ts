/**
 * @jest-environment node
 */
import { POST } from '@/app/api/auth/forgot-password/route';
import { createClient } from '@supabase/supabase-js';

// Mock dependencies
jest.mock('@supabase/supabase-js');
jest.mock('resend', () => ({
    Resend: jest.fn().mockImplementation(() => ({
        emails: { send: jest.fn().mockResolvedValue({ data: { id: 'email_id' }, error: null }) }
    }))
}));

// Mock Request object
class MockRequest {
    body: unknown;
    _headers: Record<string, string>;
    constructor(body: unknown) {
        this.body = body;
        this._headers = { origin: 'http://localhost:3000' };
    }
    json() {
        return Promise.resolve(this.body);
    }
    get headers() {
        return {
            get: (key: string) => this._headers[key] || null,
        };
    }
}

describe('POST /api/auth/forgot-password', () => {
    let mockEq: jest.Mock;
    let mockSingle: jest.Mock;
    let mockUpdate: jest.Mock;
    let mockUpdateEq: jest.Mock;

    beforeEach(() => {
        jest.clearAllMocks();

        mockSingle = jest.fn();
        mockEq = jest.fn().mockReturnValue({ single: mockSingle });
        mockUpdateEq = jest.fn().mockResolvedValue({ error: null });
        mockUpdate = jest.fn().mockReturnValue({ eq: mockUpdateEq });

        (createClient as jest.Mock).mockReturnValue({
            from: jest.fn().mockReturnValue({
                select: jest.fn().mockReturnValue({ eq: mockEq }),
                update: mockUpdate,
            }),
        });

        process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test_anon_key';
        process.env.RESEND_API_KEY = 're_123';
    });

    afterEach(() => {
        delete process.env.NEXT_PUBLIC_SUPABASE_URL;
        delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
        delete process.env.RESEND_API_KEY;
    });

    it('should normalize mixed-case email before DB lookup', async () => {
        mockSingle.mockResolvedValue({ data: { id: '123', name_en: 'John', name_ko: '존' }, error: null });

        const req = new MockRequest({ email: 'John@Gmail.COM' });
        await POST(req as unknown as Request);

        // Verify .eq was called with normalized email
        expect(mockEq).toHaveBeenCalledWith('email', 'john@gmail.com');
    });

    it('should trim whitespace from email before DB lookup', async () => {
        mockSingle.mockResolvedValue({ data: { id: '123', name_en: 'John', name_ko: '존' }, error: null });

        const req = new MockRequest({ email: '  john@gmail.com  ' });
        await POST(req as unknown as Request);

        expect(mockEq).toHaveBeenCalledWith('email', 'john@gmail.com');
    });

    it('should work with already lowercase email', async () => {
        mockSingle.mockResolvedValue({ data: { id: '123', name_en: 'John', name_ko: '존' }, error: null });

        const req = new MockRequest({ email: 'john@gmail.com' });
        await POST(req as unknown as Request);

        expect(mockEq).toHaveBeenCalledWith('email', 'john@gmail.com');
    });

    it('should return success even for non-existent email (prevent enumeration)', async () => {
        mockSingle.mockResolvedValue({ data: null, error: null });

        const req = new MockRequest({ email: 'nobody@example.com' });
        const response = await POST(req as unknown as Request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.message).toBe('If an account exists, a reset link has been sent.');
    });
});
