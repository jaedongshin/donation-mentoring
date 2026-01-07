/**
 * @jest-environment node
 */
import { POST } from '@/app/api/send-email/route';
import { Resend } from 'resend';
import { createClient } from '@supabase/supabase-js';

// Mock dependencies
jest.mock('resend', () => ({
    Resend: jest.fn()
}));

jest.mock('@supabase/supabase-js');

// Mock Request object
class MockRequest {
    body: unknown;
    constructor(body: unknown) {
        this.body = body;
    }
    json() {
        return Promise.resolve(this.body);
    }
}

describe('POST /api/send-email', () => {
    let mockSend: jest.Mock;
    let mockSupabaseFrom: jest.Mock;
    let mockSupabaseSelect: jest.Mock;

    beforeEach(() => {
        // Reset mocks
        jest.clearAllMocks();
        
        // Setup mockSend
        mockSend = jest.fn().mockResolvedValue({ data: { id: 'email_id' }, error: null });
        
        // Configure Resend mock
        (Resend as unknown as jest.Mock).mockImplementation(() => ({
            emails: {
                send: mockSend
            }
        }));

        // Mock Supabase
        mockSupabaseSelect = jest.fn().mockResolvedValue({ data: [{ email: 'admin@test.com' }], error: null });
        mockSupabaseFrom = jest.fn().mockReturnValue({
            select: mockSupabaseSelect,
        });
        
        (createClient as jest.Mock).mockReturnValue({
            from: mockSupabaseFrom,
        });

        // Set Env vars
        process.env.RESEND_API_KEY = 're_123';
        process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
    });

    it('should send email successfully when API key is present', async () => {
        const req = new MockRequest({
            name_ko: '홍길동',
            name_en: 'Hong Gil Dong',
            email: 'hong@example.com',
            position_ko: '개발자',
            company_ko: '테스트',
        });

        const response = await POST(req as unknown as Request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.message).toBe('Email sent successfully');
        expect(mockSend).toHaveBeenCalledWith(expect.objectContaining({
            to: ['admin@test.com'],
            subject: expect.stringContaining('Hong Gil Dong'),
        }));
    });

    it('should simulate email sending when API key is missing', async () => {
        delete process.env.RESEND_API_KEY;

        const req = new MockRequest({
            name_ko: '홍길동',
            name_en: 'Hong Gil Dong',
            email: 'hong@example.com',
            position_ko: '개발자',
            company_ko: '테스트',
        });

        const response = await POST(req as unknown as Request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.message).toBe('Email simulated (API key missing)');
        expect(mockSend).not.toHaveBeenCalled();
    });

    it('should fallback to default email if no admins found', async () => {
        // Mock empty admins
        mockSupabaseSelect.mockResolvedValue({ data: [], error: null });

        const req = new MockRequest({
            name_ko: '홍길동',
            name_en: 'Hong Gil Dong',
            email: 'hong@example.com',
            position_ko: '개발자',
            company_ko: '테스트',
        });

        const response = await POST(req as unknown as Request);
        
        expect(response.status).toBe(200);
        expect(mockSend).toHaveBeenCalledWith(expect.objectContaining({
            to: ['admin@donation-mentoring.org'],
        }));
    });
});
