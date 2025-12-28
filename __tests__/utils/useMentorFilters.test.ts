import { useMentorFilters, FilterState } from '@/utils/useMentorFilters';
import { renderHook } from '@testing-library/react';
import { Mentor } from '@/types/mentor';

// Mock Mentor Data
const mockMentors: Mentor[] = [
  {
    id: '1',
    name_en: 'John Doe',
    name_ko: '존 도',
    description_en: 'Software Engineer',
    description_ko: '소프트웨어 엔지니어',
    location_en: 'New York',
    location_ko: '뉴욕',
    position_en: 'Senior Dev',
    position_ko: '시니어 개발자',
    company_en: 'Tech Corp',
    company_ko: '테크 기업',
    picture_url: 'https://example.com/john.jpg',
    linkedin_url: 'https://linkedin.com/in/johndoe',
    calendly_url: 'https://calendly.com/johndoe',
    email: 'john@example.com',
    languages: ['English'],
    tags: ['React', 'Node.js'],
    is_active: true,
    session_time_minutes: 60,
    session_price_usd: 50,
  },
  {
    id: '2',
    name_en: 'Jane Smith',
    name_ko: '제인 스미스',
    description_en: 'Product Manager',
    description_ko: '프로덕트 매니저',
    location_en: 'Seoul',
    location_ko: '서울',
    position_en: 'PM',
    position_ko: 'PM',
    company_en: 'Startup Inc',
    company_ko: '스타트업',
    picture_url: 'https://example.com/jane.jpg',
    linkedin_url: 'https://linkedin.com/in/janesmith',
    calendly_url: 'https://calendly.com/janesmith',
    email: 'jane@example.com',
    languages: ['Korean', 'English'],
    tags: ['Product', 'Agile'],
    is_active: true,
    session_time_minutes: 30,
    session_price_usd: 30,
  },
];

const defaultFilters: FilterState = {
  expertise: [],
  locations: [],
  sessionLength: null,
  priceRange: [0, 100],
};

describe('useMentorFilters', () => {
  it('should return all mentors when no filters are applied', () => {
    const { result } = renderHook(() =>
      useMentorFilters({
        mentors: mockMentors,
        search: '',
        lang: 'en',
        filters: defaultFilters,
      })
    );

    expect(result.current.filteredMentors).toHaveLength(2);
  });

  it('should filter by search text', () => {
    const { result } = renderHook(() =>
      useMentorFilters({
        mentors: mockMentors,
        search: 'Jane',
        lang: 'en',
        filters: defaultFilters,
      })
    );

    expect(result.current.filteredMentors).toHaveLength(1);
    expect(result.current.filteredMentors[0].name_en).toBe('Jane Smith');
  });

  it('should filter by expertise (tags)', () => {
    const filters = { ...defaultFilters, expertise: ['React'] };
    const { result } = renderHook(() =>
      useMentorFilters({
        mentors: mockMentors,
        search: '',
        lang: 'en',
        filters,
      })
    );

    expect(result.current.filteredMentors).toHaveLength(1);
    expect(result.current.filteredMentors[0].name_en).toBe('John Doe');
  });

  it('should filter by location', () => {
    const filters = { ...defaultFilters, locations: ['Seoul'] };
    const { result } = renderHook(() =>
      useMentorFilters({
        mentors: mockMentors,
        search: '',
        lang: 'en',
        filters,
      })
    );

    expect(result.current.filteredMentors).toHaveLength(1);
    expect(result.current.filteredMentors[0].name_en).toBe('Jane Smith');
  });
});
