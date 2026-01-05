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
-- TEST MENTORS (8 approved + 2 unapproved)
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
-- APPROVED MENTORS (8)
(
    'aaaaaaaa-0001-0001-0001-aaaaaaaaaaaa',
    'Sarah Chen', '사라 첸',
    'Staff Engineer', '스태프 엔지니어',
    'Google', 'Google',
    'USA', '미국',
    'Staff engineer at Google with 12 years experience. Specializes in distributed systems.',
    'Google 스태프 엔지니어, 12년 경력. 분산 시스템 전문.',
    'sarah.chen@test.com',
    ARRAY['English', 'Korean'],
    '["Backend", "System Design", "Career Growth"]',
    false,10,
    45, 25
),
(
    'aaaaaaaa-0002-0002-0002-aaaaaaaaaaaa',
    'Michael Park', '박마이클',
    'Engineering Manager', '엔지니어링 매니저',
    'Meta', 'Meta',
    'USA', '미국',
    'Engineering manager at Meta. Former IC at Netflix. Passionate about leadership.',
    'Meta 엔지니어링 매니저. 전 Netflix IC. 리더십에 열정적.',
    'michael.park@test.com',
    ARRAY['English', 'Korean'],
    '["Leadership", "Management", "Career"]',
    false,11,
    60, 40
),
(
    'aaaaaaaa-0003-0003-0003-aaaaaaaaaaaa',
    'Emily Kim', '김에밀리',
    'Product Designer', '프로덕트 디자이너',
    'Airbnb', 'Airbnb',
    'USA', '미국',
    'Lead product designer at Airbnb. Focus on user research and design systems.',
    'Airbnb 리드 프로덕트 디자이너. 사용자 리서치와 디자인 시스템에 집중.',
    'emily.kim@test.com',
    ARRAY['English'],
    '["Design", "UX Research", "Design Systems"]',
    true, 12,
    30, 20
),
(
    'aaaaaaaa-0004-0004-0004-aaaaaaaaaaaa',
    'David Lee', '이데이비드',
    'Senior PM', '시니어 PM',
    'Amazon', 'Amazon',
    'USA', '미국',
    'Senior Product Manager at AWS. 8 years in product management.',
    'AWS 시니어 프로덕트 매니저. 프로덕트 관리 8년 경력.',
    'david.lee@test.com',
    ARRAY['English', 'Korean'],
    '["Product Management", "AWS", "Strategy"]',
    false,13,
    45, 30
),
(
    'aaaaaaaa-0005-0005-0005-aaaaaaaaaaaa',
    'Jennifer Wang', '왕제니퍼',
    'Data Scientist', '데이터 사이언티스트',
    'Netflix', 'Netflix',
    'USA', '미국',
    'Senior data scientist at Netflix. ML/AI specialist with PhD from Stanford.',
    'Netflix 시니어 데이터 사이언티스트. Stanford 박사, ML/AI 전문가.',
    'jennifer.wang@test.com',
    ARRAY['English'],
    '["Data Science", "Machine Learning", "AI"]',
    false,14,
    60, 50
),
(
    'aaaaaaaa-0006-0006-0006-aaaaaaaaaaaa',
    'Kevin Cho', '조케빈',
    'iOS Engineer', 'iOS 엔지니어',
    'Apple', 'Apple',
    'USA', '미국',
    'iOS engineer at Apple. Building consumer apps for 10 years.',
    'Apple iOS 엔지니어. 10년간 소비자 앱 개발.',
    'kevin.cho@test.com',
    ARRAY['Korean', 'English'],
    '["iOS", "Swift", "Mobile"]',
    false,15,
    30, 15
),
(
    'aaaaaaaa-0007-0007-0007-aaaaaaaaaaaa',
    'Lisa Nguyen', '리사 응우옌',
    'DevOps Lead', 'DevOps 리드',
    'Stripe', 'Stripe',
    'USA', '미국',
    'DevOps lead at Stripe. Expert in Kubernetes and cloud infrastructure.',
    'Stripe DevOps 리드. Kubernetes와 클라우드 인프라 전문가.',
    'lisa.nguyen@test.com',
    ARRAY['English'],
    '["DevOps", "Kubernetes", "Infrastructure"]',
    false,16,
    45, 35
),
(
    'aaaaaaaa-0008-0008-0008-aaaaaaaaaaaa',
    'James Yoon', '윤제임스',
    'Security Engineer', '보안 엔지니어',
    'Microsoft', 'Microsoft',
    'USA', '미국',
    'Principal security engineer at Microsoft. Focus on application security.',
    'Microsoft 수석 보안 엔지니어. 애플리케이션 보안에 집중.',
    'james.yoon@test.com',
    ARRAY['English', 'Korean'],
    '["Security", "AppSec", "Cloud Security"]',
    false,17,
    60, 45
),
-- UNAPPROVED MENTORS (2)
(
    'bbbbbbbb-0001-0001-0001-bbbbbbbbbbbb',
    'New Applicant One', '신규 지원자 1',
    'Junior Developer', '주니어 개발자',
    'Startup ABC', '스타트업 ABC',
    'Korea', '한국',
    'Recent bootcamp graduate looking to mentor others.',
    '최근 부트캠프 졸업생, 다른 사람들을 멘토링하고 싶습니다.',
    'applicant1@test.com',
    ARRAY['Korean'],
    '["Bootcamp", "Junior", "Frontend"]',
    false, 100,
    30, 0
),
(
    'bbbbbbbb-0002-0002-0002-bbbbbbbbbbbb',
    'New Applicant Two', '신규 지원자 2',
    'Mid-level Engineer', '미드레벨 엔지니어',
    'Tech Corp', '테크 회사',
    'Korea', '한국',
    'Mid-level engineer with 3 years experience wanting to give back.',
    '3년 경력 미드레벨 엔지니어, 기여하고 싶습니다.',
    'applicant2@test.com',
    ARRAY['Korean', 'English'],
    '["Backend", "Python", "Django"]',
    false, 101,
    45, 10
);

-- ============================================
-- TEST AUTH USERS
-- ============================================
-- Note: Passwords use bcrypt via pgcrypto extension
-- admin@test.com / admin
-- admin2@test.com / admin2
-- Plus regular mentor accounts
-- Note: Only mulli2@gmail.com can be super_admin (not seeded here)

INSERT INTO auth.users (
    id,
    instance_id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    recovery_token,
    email_change,
    email_change_token_new,
    email_change_token_current,
    phone_change,
    phone_change_token,
    reauthentication_token,
    is_sso_user,
    is_anonymous
) VALUES
-- Admin
(
    '22222222-2222-2222-2222-222222222222',
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'admin@test.com',
    crypt('admin', gen_salt('bf')),
    now(),
    '{"provider": "email", "providers": ["email"]}',
    '{"full_name": "Test Admin"}',
    now(),
    now(),
    '', '', '', '', '', '', '', '', false, false
),
-- Admin 2
(
    '66666666-6666-6666-6666-666666666666',
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'admin2@test.com',
    crypt('admin2', gen_salt('bf')),
    now(),
    '{"provider": "email", "providers": ["email"]}',
    '{"full_name": "Test Admin 2"}',
    now(),
    now(),
    '', '', '', '', '', '', '', '', false, false
),
-- Regular mentor users (some linked to mentors above)
(
    '33333333-3333-3333-3333-333333333333',
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'mentor1@test.com',
    crypt('mentor1', gen_salt('bf')),
    now(),
    '{"provider": "email", "providers": ["email"]}',
    '{"full_name": "Sarah Chen"}',
    now(),
    now(),
    '', '', '', '', '', '', '', '', false, false
),
(
    '44444444-4444-4444-4444-444444444444',
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'mentor2@test.com',
    crypt('mentor2', gen_salt('bf')),
    now(),
    '{"provider": "email", "providers": ["email"]}',
    '{"full_name": "Michael Park"}',
    now(),
    now(),
    '', '', '', '', '', '', '', '', false, false
),
(
    '55555555-5555-5555-5555-555555555555',
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'pending1@test.com',
    crypt('pending1', gen_salt('bf')),
    now(),
    '{"provider": "email", "providers": ["email"]}',
    '{"full_name": "New Applicant One"}',
    now(),
    now(),
    '', '', '', '', '', '', '', '', false, false
);

-- ============================================
-- UPDATE PROFILES FOR AUTH USERS
-- ============================================
-- Note: Trigger auto-creates profiles with defaults, we UPDATE to set correct values
-- Note: Only mulli2@gmail.com can be super_admin (not seeded here)

-- Admin
UPDATE public.profiles SET
    role = 'admin',
    policy_accepted_at = now()
WHERE id = '22222222-2222-2222-2222-222222222222';

-- Admin 2
UPDATE public.profiles SET
    role = 'admin',
    policy_accepted_at = now()
WHERE id = '66666666-6666-6666-6666-666666666666';

-- Mentor - Sarah Chen (mentor role, linked to mentor)
UPDATE public.profiles SET
    role = 'mentor',
    mentor_id = 'aaaaaaaa-0001-0001-0001-aaaaaaaaaaaa',
    policy_accepted_at = now()
WHERE id = '33333333-3333-3333-3333-333333333333';

-- Mentor - Michael Park (mentor role, linked to mentor)
UPDATE public.profiles SET
    role = 'mentor',
    mentor_id = 'aaaaaaaa-0002-0002-0002-aaaaaaaaaaaa',
    policy_accepted_at = now()
WHERE id = '44444444-4444-4444-4444-444444444444';

-- Pending Mentor - Applicant One (user role, not approved yet, linked to unapproved mentor)
UPDATE public.profiles SET
    role = 'user',
    mentor_id = 'bbbbbbbb-0001-0001-0001-bbbbbbbbbbbb',
    policy_accepted_at = now()
WHERE id = '55555555-5555-5555-5555-555555555555';

-- ============================================
-- SAMPLE REVIEWS
-- ============================================
INSERT INTO public.reviews (review) VALUES
('Great mentoring session! Very helpful advice on career transitions.'),
('Learned so much about frontend development best practices.'),
('Highly recommend for anyone looking to grow in tech. Super insightful!'),
('TK helped me prepare for my FAANG interview. Got the offer!'),
('Jaedong gave practical advice on building community. 10/10 would recommend.'),
('Sarah is amazing! Her system design tips landed me a job at Google.'),
('Michael''s leadership advice changed how I approach management.'),
('The best investment in my career. Thank you donation mentoring!');

-- ============================================
-- TEST ACCOUNTS SUMMARY
-- ============================================
--
-- ADMIN ACCOUNTS:
-- | Email            | Password | Role  |
-- |------------------|----------|-------|
-- | admin@test.com   | admin    | admin |
-- | admin2@test.com  | admin2   | admin |
--
-- Note: Only mulli2@gmail.com can be super_admin (not seeded here)
--
-- MENTOR ACCOUNTS:
-- | Email            | Password | Status   | Linked Mentor  |
-- |------------------|----------|----------|----------------|
-- | mentor1@test.com | mentor1  | approved | Sarah Chen     |
-- | mentor2@test.com | mentor2  | approved | Michael Park   |
-- | pending1@test.com| pending1 | pending  | Applicant One  |
--
-- MENTORS (no account - just profiles):
-- - 8 approved mentors (visible on homepage)
-- - 2 unapproved mentors (in admin pending list)
--
