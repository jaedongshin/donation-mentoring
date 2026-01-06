import { ensureProtocol, getMentorDisplay, shuffleArray, getDailyMentor } from '@/utils/helpers';
import { Mentor } from '@/types/mentor';
import { Language } from '@/utils/i18n';

describe('helpers', () => {
  describe('ensureProtocol', () => {
    it('should add https:// to URLs without protocol', () => {
      expect(ensureProtocol('example.com')).toBe('https://example.com');
      expect(ensureProtocol('www.example.com')).toBe('https://www.example.com');
    });

    it('should preserve http:// protocol', () => {
      expect(ensureProtocol('http://example.com')).toBe('http://example.com');
    });

    it('should preserve https:// protocol', () => {
      expect(ensureProtocol('https://example.com')).toBe('https://example.com');
    });

    it('should return empty string for empty input', () => {
      expect(ensureProtocol('')).toBe('');
    });
  });

  describe('getMentorDisplay', () => {
    const mockMentor: Mentor = {
      id: '1',
      name_en: 'John Doe',
      name_ko: '존 도',
      description_en: 'Software Engineer',
      description_ko: '소프트웨어 엔지니어',
      position_en: 'Senior Dev',
      position_ko: '시니어 개발자',
      company_en: 'Tech Corp',
      company_ko: '테크 기업',
      location_en: 'New York',
      location_ko: '뉴욕',
      picture_url: 'https://example.com/john.jpg',
      linkedin_url: 'https://linkedin.com/in/johndoe',
      calendly_url: 'https://calendly.com/johndoe',
      email: 'john@example.com',
      languages: ['English'],
      tags: ['React'],
      is_active: true,
      session_time_minutes: 60,
      session_price_usd: 50,
      created_at: '2024-01-01T00:00:00Z',
    };

    it('should return English fields when lang is en', () => {
      const result = getMentorDisplay(mockMentor, 'en');
      expect(result.name).toBe('John Doe');
      expect(result.description).toBe('Software Engineer');
      expect(result.position).toBe('Senior Dev');
      expect(result.company).toBe('Tech Corp');
      expect(result.location).toBe('New York');
    });

    it('should return Korean fields when lang is ko', () => {
      const result = getMentorDisplay(mockMentor, 'ko');
      expect(result.name).toBe('존 도');
      expect(result.description).toBe('소프트웨어 엔지니어');
      expect(result.position).toBe('시니어 개발자');
      expect(result.company).toBe('테크 기업');
      expect(result.location).toBe('뉴욕');
    });

    it('should fallback to English when Korean field is null', () => {
      const mentorWithNullKo: Mentor = {
        ...mockMentor,
        name_ko: null,
        description_ko: null,
      };
      const result = getMentorDisplay(mentorWithNullKo, 'ko');
      expect(result.name).toBe('John Doe');
      expect(result.description).toBe('Software Engineer');
    });

    it('should fallback to Korean when English field is null', () => {
      const mentorWithNullEn: Mentor = {
        ...mockMentor,
        name_en: null,
        description_en: null,
      };
      const result = getMentorDisplay(mentorWithNullEn, 'en');
      expect(result.name).toBe('존 도');
      expect(result.description).toBe('소프트웨어 엔지니어');
    });

    it('should use default fallback when both fields are null', () => {
      const mentorWithNulls: Mentor = {
        ...mockMentor,
        name_en: null,
        name_ko: null,
      };
      const result = getMentorDisplay(mentorWithNulls, 'en');
      expect(result.name).toBe('No Name');
    });
  });

  describe('shuffleArray', () => {
    it('should return a new array without mutating the original', () => {
      const original = [1, 2, 3, 4, 5];
      const shuffled = shuffleArray(original);
      expect(shuffled).not.toBe(original);
      expect(original).toEqual([1, 2, 3, 4, 5]);
    });

    it('should contain the same elements', () => {
      const original = [1, 2, 3, 4, 5];
      const shuffled = shuffleArray(original);
      expect(shuffled.sort()).toEqual(original.sort());
    });

    it('should handle empty array', () => {
      const result = shuffleArray([]);
      expect(result).toEqual([]);
    });

    it('should handle single element array', () => {
      const result = shuffleArray([42]);
      expect(result).toEqual([42]);
    });
  });

  describe('getDailyMentor', () => {
    const mockMentors: Mentor[] = [
      {
        id: '1',
        name_en: 'John',
        name_ko: null,
        description_en: null,
        description_ko: null,
        position_en: null,
        position_ko: null,
        company_en: null,
        company_ko: null,
        location_en: null,
        location_ko: null,
        picture_url: null,
        linkedin_url: null,
        calendly_url: null,
        email: null,
        languages: null,
        tags: null,
        is_active: true,
        session_time_minutes: null,
        session_price_usd: null,
        created_at: '2024-01-01T00:00:00Z',
      },
      {
        id: '2',
        name_en: 'Jane',
        name_ko: null,
        description_en: null,
        description_ko: null,
        position_en: null,
        position_ko: null,
        company_en: null,
        company_ko: null,
        location_en: null,
        location_ko: null,
        picture_url: null,
        linkedin_url: null,
        calendly_url: null,
        email: null,
        languages: null,
        tags: null,
        is_active: true,
        session_time_minutes: null,
        session_price_usd: null,
        created_at: '2024-01-01T00:00:00Z',
      },
      {
        id: '3',
        name_en: 'Bob',
        name_ko: null,
        description_en: null,
        description_ko: null,
        position_en: null,
        position_ko: null,
        company_en: null,
        company_ko: null,
        location_en: null,
        location_ko: null,
        picture_url: null,
        linkedin_url: null,
        calendly_url: null,
        email: null,
        languages: null,
        tags: null,
        is_active: true,
        session_time_minutes: null,
        session_price_usd: null,
        created_at: '2024-01-01T00:00:00Z',
      },
    ];

    let originalDate: DateConstructor;

    beforeEach(() => {
      originalDate = global.Date;
    });

    afterEach(() => {
      global.Date = originalDate;
    });

    it('should return null for empty array', () => {
      expect(getDailyMentor([])).toBeNull();
    });

    it('should return null for null input', () => {
      expect(getDailyMentor(null as unknown as Mentor[])).toBeNull();
    });

    it('should return the same mentor for the same date', () => {
      const mockDate = new Date('2024-01-15T12:00:00Z');
      global.Date = jest.fn(() => mockDate) as unknown as DateConstructor;
      global.Date.now = jest.fn(() => mockDate.getTime());

      const mentor1 = getDailyMentor(mockMentors);
      const mentor2 = getDailyMentor(mockMentors);

      expect(mentor1).toBe(mentor2);
    });

    it('should return a mentor from the array', () => {
      const mockDate = new Date('2024-01-15T12:00:00Z');
      global.Date = jest.fn(() => mockDate) as unknown as DateConstructor;
      global.Date.now = jest.fn(() => mockDate.getTime());

      const mentor = getDailyMentor(mockMentors);
      expect(mentor).toBeDefined();
      expect(mockMentors).toContain(mentor);
    });
  });
});

