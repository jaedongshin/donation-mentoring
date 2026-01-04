-- Seed data for local Supabase development
-- This runs during `supabase db reset`

-- ============================================
-- REAL MENTORS (from production)
-- ============================================
INSERT INTO public.mentors (
    id,
    name_en, name_ko,
    position_en, position_ko,
    company_en, company_ko,
    location_en, location_ko,
    description_en, description_ko,
    picture_url, linkedin_url, calendly_url, email,
    languages, tags, is_active, display_order,
    session_time_minutes, session_price_usd
) VALUES
(
    '9ea4f911-fb5b-4f6c-8f59-de909137bff0',
    'Taeho (TK) Kim', '김태호',
    'UX Engineer', 'UX Engineer',
    'Powder (YC W24)', 'Powder (YC W24)',
    'USA', '미국',
    'Has experience from Samsung to 5th startup. Currently VP of Bay Area K-Group and operates a K-group Design.',
    '삼성부터 5번째 스타트업까지 여러 경험 보유. 현재 Bay Area K-Group VP 와 디자인 그룹 운영.',
    'https://iehcoikvflnhwtehfrhw.supabase.co/storage/v1/object/public/mentor-pictures/0.6772318297576914.jpeg',
    'https://www.linkedin.com/in/tkhfes/',
    'https://calendly.com/tk-hfes/mentoring',
    'tk.hfes@gmail.com',
    ARRAY['Korean'],
    '["Frontend", "UX", "UXE", "AI", "Interview", "Resume", "React"]',
    true, 1,
    30, 10
),
(
    '649db9fb-a801-4fdf-b0ab-ec7c7d1b0c40',
    'Jaedong Shin', '신재동',
    'Senior Software Engineer', 'Senior Software Engineer',
    'Uber', 'Uber',
    'USA', '미국',
    '19-year SWE. Founded the donation mentoring model and Study Club++. Interested in community and development.',
    '19년 차 SWE. 기부 멘토링 모델과 Study Club++를 창립. 커뮤니티와 개발에 관심 많음.',
    'https://iehcoikvflnhwtehfrhw.supabase.co/storage/v1/object/public/mentor-pictures/0.4726313691281572.jpeg',
    'https://www.linkedin.com/in/jaedong-shin/',
    'https://calendly.com/mulli2/1on1',
    'mulli2@gmail.com',
    ARRAY['Korean', 'English'],
    '["resume", "mock interview", "community"]',
    true, 2,
    60, 30
);

-- ============================================
-- TEST MENTORS (for local dev testing)
-- ============================================
INSERT INTO public.mentors (
    id,
    name_en, name_ko,
    position_en, position_ko,
    company_en, company_ko,
    location_en, location_ko,
    description_en, description_ko,
    email, languages, tags, is_active, display_order,
    session_time_minutes, session_price_usd
) VALUES
(
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'Test Mentor (Approved)', '테스트 멘토 (승인됨)',
    'Software Engineer', '소프트웨어 엔지니어',
    'Test Company', '테스트 회사',
    'USA', '미국',
    'Test mentor account for development - approved status.',
    '개발용 테스트 멘토 계정 - 승인 상태.',
    'test.mentor@example.com',
    ARRAY['English'],
    '["test", "development"]',
    true, 100,
    30, 0
),
(
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    'Test Pending Mentor', '테스트 대기 멘토',
    'Junior Developer', '주니어 개발자',
    'Startup Inc', '스타트업',
    'Korea', '한국',
    'Test mentor account for development - pending approval.',
    '개발용 테스트 멘토 계정 - 승인 대기.',
    'test.pending@example.com',
    ARRAY['Korean'],
    '["test", "pending"]',
    false, 101,
    45, 20
),
(
    'cccccccc-cccc-cccc-cccc-cccccccccccc',
    'Test Admin User', '테스트 관리자',
    'Admin', '관리자',
    'Platform Admin', '플랫폼 관리',
    'USA', '미국',
    'Test admin account for development.',
    '개발용 테스트 관리자 계정.',
    'test.admin@example.com',
    ARRAY['English', 'Korean'],
    '["admin", "test"]',
    false, 102,
    60, 0
);

-- ============================================
-- SAMPLE REVIEWS
-- ============================================
INSERT INTO public.reviews (review) VALUES
('Great mentoring session! Very helpful advice on career transitions.'),
('Learned so much about frontend development best practices.'),
('Highly recommend for anyone looking to grow in tech. Super insightful!'),
('TK helped me prepare for my FAANG interview. Got the offer!'),
('Jaedong gave practical advice on building community. 10/10 would recommend.');

-- ============================================
-- NOTE: User profiles are NOT seeded here
-- ============================================
-- Profiles are created automatically when users sign up via Supabase Auth.
-- The handle_new_user() trigger links profiles to mentors by matching email.
--
-- To test locally:
-- 1. Run `supabase db reset` to apply migrations + seed
-- 2. Go to http://localhost:3000/login
-- 3. Sign up with Google (or email when implemented)
-- 4. Your profile will be auto-created and linked to mentor if email matches
--
-- For test accounts (email/password auth):
-- After implementing email auth, you can sign up with:
-- - test.mentor@example.com (will link to approved test mentor)
-- - test.pending@example.com (will link to pending test mentor)
-- - test.admin@example.com (will link to admin test mentor)
